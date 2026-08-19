# OpenTaberna Admin

Back-office for the OpenTaberna store: what customers can see, what is in stock,
what has been ordered and what is coming back.

Admin only. Every screen here is behind the `admin` realm role, and the API
additionally refuses admin endpoints unless the token was issued to this client
— so an administrator signed into the storefront cannot drive the back office
from there.

## Running it

The API and Keycloak must be up first (in the `fastapi` repository):

```bash
docker compose -f docker-compose.dev.yml up -d
```

Then:

```bash
npm install
npm start          # http://localhost:4200
```

You will be redirected to Keycloak. In development:

| Username | Password | Result |
|---|---|---|
| `adminuser` | `adminpassword` | Full access |
| `testuser` | `testpassword` | "Not an administrator" screen |

## Architecture

The same structure is intended for the storefront, so both frontends read the
same way.

```
src/
  app/
    core/          # singletons — one instance, injected anywhere
      auth/        # Keycloak session, HTTP interceptor, admin guard
      api/         # one typed client per API domain
      models/      # interfaces mirroring the API schemas
    shared/ui/     # reusable presentational components. No API calls.
    layout/        # the frame: shell, sidenav, topbar
    features/      # one folder per screen, lazy-loaded
  styles.css       # THE global design file
  environments/    # API and Keycloak URLs per build
```

Four rules keep it that way:

1. **`core/` is injected, never imported into a template.** Services and
   guards live here; anything with a template does not.
2. **`shared/ui/` never talks to the API.** A component that fetches cannot be
   reused on a screen that already has the data.
3. **`features/` never talks to `HttpClient` directly** — always through a
   `core/api` client, so the base URL and error shape stay in one place.
4. **No design literals in templates.** No hex colour, no `rounded-[7px]`. If a
   token does not exist, add it to `styles.css`.

### The global design file

`src/styles.css` is the single source of truth for how the product looks:
Tailwind v4 `@theme` tokens for colour, radius, shadow and type, then a small
set of semantic classes (`.card`, `.field-control`, `.data-table`) for patterns
repeated across many screens.

Semantic classes are deliberately few. Something used once stays a utility in
the template; a class earns its place only when copying the utility string
around would let screens drift apart.

Status colour is assigned by meaning rather than by feature, so `danger` means
the same thing on an order, a stock level and a return. A reader learns the
palette once.

### Reusable components

`shared/ui` exports `ot-button`, `ot-badge`, `ot-card`, `ot-modal`,
`ot-page-header`, `ot-empty-state`, `ot-spinner`, `ot-alert` and the `money`
pipe. They are standalone and imported per feature, so a lazy chunk pulls in
only what it renders.

`ot-empty-state` exists because "no data" and "still loading" otherwise look
identical, which is the most common way an admin screen confuses its operator.

### Authentication

`core/auth` owns the whole story. `AuthService` runs the authorization-code +
PKCE flow through `keycloak-js`, an `APP_INITIALIZER` completes it before the
first route resolves, and an interceptor attaches the token — but only to
requests aimed at `apiBaseUrl`, never to a third-party host.

`adminGuard` is a usability guard, not a security boundary. The API enforces
access on its own; the guard exists so a signed-in customer gets an explanation
instead of a screen of failing requests.

## Commands

```bash
npm start                        # dev server on :4200
npm run build                    # production bundle
npx ng test --watch=false        # unit tests
npx prettier --check "src/**/*.{ts,html,css}"
```

## Configuration

`src/environments/environment.ts` holds the API base URL and the Keycloak
realm/client. The client id must stay `opentaberna-admin-ui`: the API checks the
token's `azp` against its list of admin clients, and any other client's token is
refused on `/v1/admin/**`.
