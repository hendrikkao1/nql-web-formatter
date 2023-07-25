export default {
  build: {
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
