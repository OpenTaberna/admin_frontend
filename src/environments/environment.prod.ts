/**
 * Production configuration.
 *
 * Same shape as the development file. The values are placeholders — replace
 * them at deploy time rather than committing real hosts.
 */
export const environment = {
  production: true,
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
    url: 'https://auth.opentaberna.de',
    realm: 'opentaberna',
    clientId: 'opentaberna-admin-ui',
  },
} as const;
