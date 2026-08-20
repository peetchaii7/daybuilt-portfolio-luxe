import { defineConfig } from 'vitest/config';

const integrationTests = [
  'src/__tests__/image-read-security.test.ts',
  'src/__tests__/upload-security.test.ts',
];
const hasIntegrationTestEnvironment = Boolean(
  process.env.DATABASE_URL && process.env.SESSION_SECRET,
);

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Keep the default test command useful in local/CI environments without
    // infrastructure secrets. When both variables are present, the same
    // command includes the database and object-storage integration suites.
    exclude: hasIntegrationTestEnvironment ? [] : integrationTests,
    // These are integration tests against the real dev database and object
    // storage; run files serially so concurrency tests measure their own races.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
