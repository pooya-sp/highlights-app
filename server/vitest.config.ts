import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Only pick up test files in the tests/ folder
    include: ["tests/**/*.test.ts"],
    // ESM mode matches our "type": "module" package
    environment: "node",
    // Integration tests (in-memory MongoDB boot) can be slow on first run
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
