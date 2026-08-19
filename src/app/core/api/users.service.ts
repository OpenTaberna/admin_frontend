import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';

/** A Keycloak account as this application needs it. */
export interface ManagedUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  phone?: string;
  createdTimestamp?: number;
  isAdmin: boolean;
}

interface KeycloakRole {
  id: string;
  name: string;
}

/**
 * User administration, against Keycloak's own admin API.
 *
 * Deliberately not routed through the FastAPI service. Keycloak owns accounts
 * and roles, so going straight there means Keycloak enforces permission — the
 * admin's token carries `manage-users`, `view-users` and `view-realm` through
 * the composite `admin` role, and a customer's token simply gets 403. Proxying
 * it through the API would mean re-implementing that check, and any mistake in
 * the re-implementation would be a privilege-escalation bug.
 */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  private get base(): string {
    return `${environment.keycloak.url}/admin/realms/${environment.keycloak.realm}`;
  }

  /**
   * List accounts along with whether each holds the admin role.
   *
   * Keycloak has no endpoint returning users with their roles, so the role
   * mapping is fetched per user. Fine at this scale; if the realm grows to
   * thousands this should move to a paged view that resolves roles lazily.
   */
  list(): Observable<ManagedUser[]> {
    return this.http
      .get<Record<string, any>[]>(`${this.base}/users`, {
        params: { max: 200, briefRepresentation: false },
      })
      .pipe(
        switchMap((raw) => {
          if (raw.length === 0) {
            return of([] as ManagedUser[]);
          }
          return forkJoin(
            raw.map((u) =>
              this.http
                .get<KeycloakRole[]>(`${this.base}/users/${u['id']}/role-mappings/realm`)
                .pipe(
                  map((roles) =>
                    this.toManagedUser(
                      u,
                      roles.some((r) => r.name === 'admin'),
                    ),
                  ),
                ),
            ),
          );
        }),
      );
  }

  /** Grant the admin realm role. */
  promote(userId: string): Observable<void> {
    return this.adminRole().pipe(
      switchMap((role) =>
        this.http.post<void>(`${this.base}/users/${userId}/role-mappings/realm`, [role]),
      ),
    );
  }

  /** Remove the admin realm role, leaving the account as a customer. */
  demote(userId: string): Observable<void> {
    return this.adminRole().pipe(
      switchMap((role) =>
        this.http.delete<void>(`${this.base}/users/${userId}/role-mappings/realm`, {
          body: [role],
        }),
      ),
    );
  }

  /** Delete the account outright. */
  remove(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${userId}`);
  }

  private adminRole(): Observable<KeycloakRole> {
    return this.http.get<KeycloakRole>(`${this.base}/roles/admin`);
  }

  private toManagedUser(raw: Record<string, any>, isAdmin: boolean): ManagedUser {
    return {
      id: raw['id'],
      username: raw['username'] ?? '',
      email: raw['email'] ?? '',
      firstName: raw['firstName'] ?? '',
      lastName: raw['lastName'] ?? '',
      enabled: raw['enabled'] ?? false,
      phone: raw['attributes']?.['phone']?.[0],
      createdTimestamp: raw['createdTimestamp'],
      isAdmin,
    };
  }
}
