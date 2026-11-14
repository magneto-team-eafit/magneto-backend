import { defineConfig } from "vitest/config";

// Las pruebas viven en la carpeta tests/, aparte del codigo de src/.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});