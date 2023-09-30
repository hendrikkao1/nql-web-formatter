import { IDisposable, Uri, languages } from "monaco-editor-core";
import * as languageFeatures from "./languageFeatures";
import { WorkerManager } from "./workerManager";
import { INqlWorker } from "./monaco.contribution";

export const languageSelector = "nql";

export function setupMode(): (...uris: Uri[]) => Promise<INqlWorker> {
  const disposables: IDisposable[] = [];
  const providers: IDisposable[] = [];

  const client = new WorkerManager(languageSelector);

  disposables.push(client);

  const worker = (...resources: Uri[]): Promise<INqlWorker> => {
    return client.getLanguageServiceWorker(...resources);
  };

  function registerProviders(): void {
    disposeAll(providers);

    providers.push(
      languages.registerDocumentFormattingEditProvider(
        languageSelector,
        new languageFeatures.FormattingAdapter(worker)
      )
    );

    providers.push(
      languages.setMonarchTokensProvider(
        languageSelector,
        languageFeatures.languageDefinition
      )
    );

    providers.push(
      languages.registerDocumentSemanticTokensProvider(
        languageSelector,
        new languageFeatures.TokenAdapter(worker)
      )
    );

    providers.push(new languageFeatures.DiagnosticsAdapter(worker));
  }

  registerProviders();

  disposables.push(asDisposable(providers));

  return worker;
}

function asDisposable(disposables: IDisposable[]): IDisposable {
  return { dispose: () => disposeAll(disposables) };
}

function disposeAll(disposables: IDisposable[]) {
  while (disposables.length) {
    disposables.pop()!.dispose();
  }
}
