/**
 * Runtime configuration for local development.
 *
 * `apiBaseUrl` points at the FastAPI service; `keycloak` matches the realm
 * committed in the API repository (`keycloak/opentaberna-realm.json`).
 *
 * The client id matters: the API only accepts tokens on `/v1/admin/**` whose
 * `azp` is an admin client, so signing in through the storefront client would
 * yield a token this application cannot use.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8000',
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
