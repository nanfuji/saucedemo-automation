import { defineConfig } from 'allure';

export default defineConfig({
  name: 'SauceDemo E2E Test Report',
  output: './allure-report',
  plugins: {
    awesome: {
      options: {
        reportName: 'SauceDemo E2E Test Report',
        singleFile: false,
        reportLanguage: 'en',
        groupBy: ['feature'],
      },
    },
  },
});
