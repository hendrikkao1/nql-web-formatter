import "./style.css";
import defaultValue from "./default-value";
import * as monaco from "monaco-editor";

import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import NqlWorker from "./language/nql/nql.worker.ts?worker";
import {
  setupMode,
  languageSelector as nqlLanguageSelector,
} from "./language/nql/nqlMode";

self.MonacoEnvironment = {
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
    theme: "vs-dark",
    "semanticHighlighting.enabled": true,
  }
);

document.querySelector("[data-js-id=format]")?.addEventListener("click", () => {
  editor.getAction?.("editor.action.formatDocument")?.run();
});
