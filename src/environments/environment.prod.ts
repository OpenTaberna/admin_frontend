/**
 * Production configuration.
 *
 * Same shape as the development file. The values are placeholders — replace
 * them at deploy time rather than committing real hosts.
 */
export const environment = {
  production: true,
  apiBaseUrl: '/api',
  keycloak: {
    url: 'https://auth.opentaberna.de',
    realm: 'opentaberna',
    clientId: 'opentaberna-admin-ui',
  },
} as const;
