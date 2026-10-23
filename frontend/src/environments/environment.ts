/**
 * Configuracao de producao. O site e a API ficam no mesmo endereco: o nginx
 * (frontend/nginx.conf) repassa /api para o backend.
 */
export const environment = {
  apiUrl: '/api',
};
