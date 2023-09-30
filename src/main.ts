import * as monaco from "monaco-editor-core";
import { Environment } from "monaco-editor-core/esm/vs/editor/editor.api";
import EditorWorker from "monaco-editor-core/esm/vs/editor/editor.worker?worker";
import defaultValue from "./default-value";
import NqlWorker from "./language/nql/nql.worker?worker";
import {
  setupMode,
  languageSelector as nqlLanguageSelector,
} from "./language/nql/nqlMode";
import "./theme";

declare global {
  interface Window {
    MonacoEnvironment: Environment;
  }
}

window.MonacoEnvironment = {
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

const isDarkMode =
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const editor = monaco.editor.create(
  document.querySelector("#editor") as HTMLDivElement,
  {
    value: defaultValue,
    language: nqlLanguageSelector,
    theme: isDarkMode ? "nql-dark" : "nql-light",
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
