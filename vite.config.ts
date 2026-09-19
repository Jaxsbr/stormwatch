import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    rolldownOptions: { input: { game: "index.html", qa: "qa.html" } },
  },
  server: { port: 4173 },
});
