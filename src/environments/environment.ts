/**
 * Runtime configuration for local development.
 *
 * `apiBaseUrl` is a same-origin path, not a host. Both ways of running this app
 * map `/api` onto the FastAPI service — nginx does it in the container,
 * `proxy.conf.json` does it for `ng serve` — so the application never carries a
 * hardcoded API host and the two behave identically.
 *
 * The Keycloak URL stays absolute because the browser is redirected to it, so a
 * same-origin path would be meaningless there.
 * `keycloak` matches the realm
 * committed in the API repository (`keycloak/opentaberna-realm.json`).
 *
 * The client id matters: the API only accepts tokens on `/v1/admin/**` whose
 * `azp` is an admin client, so signing in through the storefront client would
 * yield a token this application cannot use.
 */
export const environment = {
  production: false,
  apiBaseUrl: '/api',
  /**
   * Uncaught error reporting. Off by default; requires FRONTEND_ERRORS_ENABLED
   * on the API, which otherwise answers the endpoint with a 404.
   */
  errorReporting: {
    enabled: false,
    endpoint: '/v1/telemetry/errors',
  },
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'opentaberna',
    clientId: 'opentaberna-admin-ui',
  },
} as const;
