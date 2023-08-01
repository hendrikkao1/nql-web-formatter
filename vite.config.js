/** @type {import('vite').UserConfig} */
export default {
  base: "/nql-web-formatter/",
  build: {
    outDir: "docs",
    rollupOptions: {
      output: {
        manualChunks: {
          nqlWorker: ["./src/language/nql/nql.worker.ts"],
          editorWorker: ["monaco-editor/esm/vs/editor/editor.worker"],
        },
      },
    },
  },
};
