import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Keep built assets portable when a preview is mounted below /pr-<number>/.
  base: "./",
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/testSetup.ts",
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
    testTimeout: 15000,
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/testSetup.ts', 'src/types/**'],
      thresholds: { 'src/lib/**': { statements: 90, branches: 90, functions: 90, lines: 90 } },
    },
  },
});
