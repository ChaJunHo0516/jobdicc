/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages 경로: https://ChaJunHo0516.github.io/jobdicc/prebridge/ (루트는 PreJob)
export default defineConfig({
  base: "/jobdicc/prebridge/",
  plugins: [react(), tailwindcss()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
