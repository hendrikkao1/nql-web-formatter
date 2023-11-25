import {
  CancellationToken,
  IDisposable,
  MarkerSeverity,
  Uri,
  editor,
  languages,
} from "monaco-editor-core";
import { INqlWorker } from "./monaco.contribution";
import { editorTokenModifierList, editorTokenTypeList, nqlTokensToVSCodeTokens} from "./lib/nql";

export abstract class Adapter {
  constructor(protected _worker: (...uris: Uri[]) => Promise<INqlWorker>) {}
}

export class TokenAdapter
  extends Adapter
  implements languages.DocumentSemanticTokensProvider
{
  public getLegend(): languages.SemanticTokensLegend {
    return {
      tokenTypes: editorTokenTypeList as string[],
      tokenModifiers: editorTokenModifierList as string[],
    };
  }

  public async provideDocumentSemanticTokens(
    model: editor.IReadOnlyModel,
    _: string | null,
    token: CancellationToken
  ): Promise<languages.SemanticTokens | undefined> {
    const resource = model.uri;
    const worker = await this._worker(resource);

    let nqlTokens = [];

    try {
      nqlTokens = await worker.getTokens(resource.toString());
    } catch (err) {
      console.error(err);
      return undefined;
    }

    const editorTokens = nqlTokensToVSCodeTokens(nqlTokens);

    if (token.isCancellationRequested) {
      return undefined;
    }

    return {
      data: new Uint32Array(editorTokens),
      resultId: undefined,
    };
  }

  public releaseDocumentSemanticTokens() {}
}

export class FormattingAdapter
  extends Adapter
  implements languages.DocumentFormattingEditProvider
{
  public async provideDocumentFormattingEdits(
    model: editor.IReadOnlyModel,
    _: languages.FormattingOptions,
    token: CancellationToken
  ): Promise<languages.TextEdit[] | undefined> {
    const resource = model.uri;
    const worker = await this._worker(resource);
    const formatted = await worker.format(resource.toString());

    const edit: languages.TextEdit = {
      range: model.getFullModelRange(),
      text: formatted,
    };

    if (token.isCancellationRequested) {
      return undefined;
    }

    return Promise.resolve([edit]);
  }
}

export class DiagnosticsAdapter extends Adapter {
  private _disposables: IDisposable[] = [];
  private _listener: { [uri: string]: IDisposable } = Object.create(null);

  constructor(worker: (...uris: Uri[]) => Promise<INqlWorker>) {
    super(worker);

    const onModelAdd = (model: editor.IModel): void => {
      if (model.getLanguageId() !== "nql") {
        return;
      }

      const validate = () => {
        this._doValidate(model);
      };

      let handle: number;

      const changeSubscription = model.onDidChangeContent(() => {
        clearTimeout(handle);
        handle = window.setTimeout(validate, 500);
      });

      this._listener[model.uri.toString()] = {
        dispose() {
          changeSubscription.dispose();
          clearTimeout(handle);
        },
      };

      validate();
    };

    const onModelRemoved = (model: editor.IModel): void => {
      editor.setModelMarkers(model, "nql", []);

      const key = model.uri.toString();

      if (this._listener[key]) {
        this._listener[key].dispose();
        delete this._listener[key];
      }
    };

    this._disposables.push(
      editor.onDidCreateModel((model) => onModelAdd(model))
    );

    this._disposables.push(editor.onWillDisposeModel(onModelRemoved));

    this._disposables.push({
      dispose() {
        for (const model of editor.getModels()) {
          onModelRemoved(model);
        }
      },
    });

    editor.getModels().forEach((model) => onModelAdd(model));
  }

  public dispose(): void {
    this._disposables.forEach((d) => d && d.dispose());
    this._disposables = [];
  }

  private async _doValidate(model: editor.ITextModel): Promise<void> {
    const resource = model.uri;
    const worker = await this._worker(resource);
    const errors = await worker.getParseErrors(resource.toString());

    if (model.isDisposed()) {
      // model was disposed in the meantime
      return;
    }

    editor.setModelMarkers(
      model,
      "nql",
      errors.map((e) => ({
        severity: MarkerSeverity.Error,
        startLineNumber: e.startPosition.row + 1,
        startColumn: e.startPosition.column + 1,
        endLineNumber: e.endPosition.row + 1,
        endColumn: e.endPosition.column + 1,
        message: `Syntax error: "${e.text}"`,
      }))
    );
  }
}

export const languageDefinition: languages.IMonarchLanguage = {
  tokenizer: {
    root: [
      [/\band\b/, "keyword"],
      [/\basc\b/, "keyword"],
      [/\bby\b/, "keyword"],
      [/\bcompute\b/, "control"],
      [/\bdesc\b/, "keyword"],
      [/\bduring past\b/, "keyword"],
      [/\bfrom\b/, "keyword"],
      [/\binclude\b/, "control"],
      [/\blist\b/, "control"],
      [/\blimit\b/, "keyword"],
      [/\bon\b/, "keyword"],
      [/\bor\b/, "keyword"],
      [/\bsort\b/, "control"],
      [/\bsummarize\b/, "control"],
      [/\bto\b/, "keyword"],
      [/\bwhere\b/, "control"],
      [/\bwith\b/, "control"],
    ],
  },
};
