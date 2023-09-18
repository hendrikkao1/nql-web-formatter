import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    base: env.VITE_BASE_PATH,
    define: {
      __BASE_PATH__: JSON.stringify(env.VITE_BASE_PATH),
    },
    build: {
      outDir: "docs",
      rollupOptions: {
        output: {
          manualChunks: {},
        },
      },
    },
  };
});
