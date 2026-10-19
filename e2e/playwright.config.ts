import { defineConfig } from '@playwright/test';

export const SITE = process.env.E2E_SITE ?? 'http://localhost:4200';
export const API = process.env.E2E_API ?? 'http://localhost:3000';

/**
 * Testes de navegador da Linka. Sobem o backend e o frontend sozinhos (ou
 * reaproveitam os que ja estiverem rodando, fora da CI). Cada execucao cria
 * uma escola propria de teste e a desativa no final (global-setup/teardown).
 */
export default defineConfig({
  testDir: './tests',
  // Os testes compartilham a mesma escola de teste: um de cada vez.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  use: {
    baseURL: SITE,
    // Na maquina de desenvolvimento usa o Edge do Windows; na CI, o Chromium.
    channel: process.env.CI || process.env.E2E_CHROMIUM ? undefined : 'msedge',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.E2E_SEM_SERVIDORES
    ? undefined
    : [
        {
          command: 'npm run build && npm run start:prod',
          cwd: '../backend',
          url: `${API}/api`,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
        {
          command: 'npm start',
          cwd: '../frontend',
          url: SITE,
          reuseExistingServer: !process.env.CI,
          timeout: 240_000,
        },
      ],
});
