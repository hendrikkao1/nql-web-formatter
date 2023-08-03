import { IDisposable, Uri, languages } from "monaco-editor";
import * as languageFeatures from "./languageFeatures";
import { WorkerManager } from "./workerManager";
import { NqlWorker } from "./monaco.contribution";

export const languageSelector = "nql";

export function setupMode(): (...uris: Uri[]) => Promise<NqlWorker> {
  const disposables: IDisposable[] = [];
  const providers: IDisposable[] = [];

  const client = new WorkerManager(languageSelector);

  disposables.push(client);

  const worker = (...resources: Uri[]): Promise<NqlWorker> => {
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
      languages.setMonarchTokensProvider(languageSelector, {
        tokenizer: {
          root: [
            [/\band\b/, "keyword"],
            [/\basc\b/, "keyword"],
            [/\bby\b/, "keyword"],
            [/\bcompute\b/, "keyword"],
            [/\bdesc\b/, "keyword"],
            [/\bduring\b \bpast\b/, "keyword"],
            [/\bfrom\b/, "keyword"],
            [/\bin\b/, "keyword"],
            [/\bin\b/, "keyword"],
            [/\binclude\b/, "keyword"],
            [/\blist\b/, "keyword"],
            [/\bor\b/, "keyword"],
            [/\bsort\b/, "keyword"],
            [/\bsummarize\b/, "keyword"],
            [/\bto\b/, "keyword"],
            [/\bwhere\b/, "keyword"],
          ],
        },
      })
    );

    providers.push(
      languages.registerDocumentSemanticTokensProvider(
        languageSelector,
        new languageFeatures.TokenAdapter(worker)
      )
    );
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