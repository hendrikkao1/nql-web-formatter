import defaultValue from "./default-value";
import * as monaco from "monaco-editor-core";

import EditorWorker from "monaco-editor-core/esm/vs/editor/editor.worker?worker";
import NqlWorker from "./language/nql/nql.worker?worker";
import {
  setupMode,
  languageSelector as nqlLanguageSelector,
} from "./language/nql/nqlMode";

const isDarkMode =
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;
  
MonacoEnvironment = {
  getWorker(_: string, label: string) {
    if (label === nqlLanguageSelector) {
      return new NqlWorker();
    }
    return new EditorWorker();
  },
};

monaco.languages.register({
  id: nqlLanguageSelector,
});

monaco.languages.onLanguage(nqlLanguageSelector, () => {
  setupMode();
});

const editor = monaco.editor.create(
  document.querySelector("#editor") as HTMLDivElement,
  {
    value: defaultValue,
    language: nqlLanguageSelector,
    theme: isDarkMode ? "vs-dark" : "vs-light",
    "semanticHighlighting.enabled": true,
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
  }
);

document.querySelector("[data-js-id=format]")?.addEventListener("click", () => {
  editor.getAction?.("editor.action.formatDocument")?.run();
});
