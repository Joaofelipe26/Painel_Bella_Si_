import { defineConfig, devices } from '@playwright/test';

const PORTA = 3007;
/** PW_BASE_URL=http://localhost:3005 usa um servidor que já está rodando, sem criar outro. */
const urlExistente = process.env.PW_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: 'test-results/saida',
  use: {
    baseURL: urlExistente ?? `http://localhost:${PORTA}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'celular-360', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 800 } } },
    { name: 'celular-390', use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: urlExistente
    ? undefined
    : {
        command: `npm run db:semear -- --limpar && npx next dev -p ${PORTA}`,
        url: `http://localhost:${PORTA}/entrar`,
        reuseExistingServer: false,
        timeout: 120_000,
        env: { APP_PIN: '1234', DATABASE_URL: '' },
      },
});
