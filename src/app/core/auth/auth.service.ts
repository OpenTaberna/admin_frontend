import { Injectable, signal, computed } from '@angular/core';
import Keycloak from 'keycloak-js';

import { environment } from '../../../environments/environment';

/**
 * The signed-in administrator, as described by the Keycloak token.
 */
export interface AdminUser {
  subject: string;
  username: string;
  email: string;
  displayName: string;
  roles: string[];
}

/**
 * Keycloak session for the admin application.
 *
 * Uses the authorization-code flow with PKCE against the `opentaberna-admin-ui`
 * client. That client matters twice over: it is what gives the token an `azp`
 * the API accepts on `/v1/admin/**`, and it is why an administrator signed into
 * the storefront cannot drive the back office from there.
 *
 * `login-required` means an unauthenticated visitor is redirected to Keycloak
 * before the application renders at all — there is no anonymous view of an
 * admin tool worth showing.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private keycloak?: Keycloak;

  private readonly userSignal = signal<AdminUser | null>(null);

  /** The signed-in administrator, or null before initialisation completes. */
  readonly user = this.userSignal.asReadonly();

  /** True once a token is held. */
  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  /**
   * True when the account carries the admin realm role.
   *
   * The API enforces this independently — this only decides what to render, so
   * a non-admin sees an explanation rather than a wall of failing requests.
   */
  readonly isAdmin = computed(() => this.userSignal()?.roles.includes('admin') ?? false);

  /**
   * Start the Keycloak session. Called once from an APP_INITIALIZER.
   *
   * @returns true when a valid session exists.
   */
  async init(): Promise<boolean> {
    this.keycloak = new Keycloak({
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId,
    });

    const authenticated = await this.keycloak.init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });

    if (authenticated) {
      this.readUserFromToken();
    }
    return authenticated;
  }

  /**
   * Return a valid access token, refreshing it when close to expiry.
   *
   * @returns The raw JWT, or null when there is no session.
   */
  async getToken(): Promise<string | null> {
    if (!this.keycloak) {
      return null;
    }
    try {
      // Refresh when fewer than 30 seconds remain, so a request never leaves
      // with a token that expires in flight.
      await this.keycloak.updateToken(30);
    } catch {
      await this.login();
      return null;
    }
    return this.keycloak.token ?? null;
  }

  /** Send the browser to the Keycloak login page. */
  async login(): Promise<void> {
    await this.keycloak?.login();
  }

  /** End the session and return to the application root. */
  async logout(): Promise<void> {
    await this.keycloak?.logout({ redirectUri: window.location.origin });
  }

  /** Open the Keycloak account console, where profile and phone are edited. */
  accountUrl(): string {
    return `${environment.keycloak.url}/realms/${environment.keycloak.realm}/account`;
  }

  private readUserFromToken(): void {
    const parsed = this.keycloak?.tokenParsed as Record<string, any> | undefined;
    if (!parsed) {
      return;
    }
    const given = parsed['given_name'] ?? '';
    const family = parsed['family_name'] ?? '';
    const username = parsed['preferred_username'] ?? '';
    this.userSignal.set({
      subject: parsed['sub'],
      username,
      email: parsed['email'] ?? '',
      displayName: `${given} ${family}`.trim() || username,
      roles: parsed['realm_access']?.roles ?? [],
    });
  }
}
