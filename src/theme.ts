import * as monaco from "monaco-editor-core";

monaco.editor.defineTheme("nql-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "function", foreground: "#DCDCAA" },
    { token: "property", foreground: "#9CDCFE" },
    { token: "variable", foreground: "#4FC1FF" },
    { token: "boolean", foreground: "#569CD6" },
    { token: "control", foreground: "#C586C0" },
    { token: "variable.defaultLibrary", foreground: "#9CDCFE" },
  ],
  colors: {},
});

monaco.editor.defineTheme("nql-light", {
  base: "vs",
  inherit: true,
  rules: [
    { token: "function", foreground: "#795E26" },
    { token: "property", foreground: "#001080" },
    { token: "variable", foreground: "#0070C1" },
    { token: "boolean", foreground: "#0000FF" },
    { token: "control", foreground: "#AF00DB" },
    { token: "variable.defaultLibrary", foreground: "#001080" },
  ],
  colors: {},
});
