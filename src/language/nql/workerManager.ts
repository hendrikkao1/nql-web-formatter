import { Uri, editor } from "monaco-editor";
import { INqlWorker } from "./monaco.contribution";

export class WorkerManager {
  private _worker: editor.MonacoWebWorker<INqlWorker> | null;
  private _client: Promise<INqlWorker> | null;

  constructor(private readonly _languageSelector: string) {
    this._worker = null;
    this._client = null;
  }

  dispose(): void {
    this._stopWorker();
  }

  private _stopWorker(): void {
    if (this._worker) {
      this._worker.dispose();
      this._worker = null;
    }
    this._client = null;
  }

  private _getClient(): Promise<INqlWorker> {
    if (!this._client) {
      this._client = (async () => {
        this._worker = editor.createWebWorker<INqlWorker>({
          // module that exports the create() method and returns a `NqlWorker` instance
          moduleId: "nql",
          label: this._languageSelector,
          keepIdleModels: true,
          // passed in to the create() method
          createData: {},
        });

        const proxy = await this._worker.getProxy();

        return proxy;
      })();
    }

    return this._client;
  }

  async getLanguageServiceWorker(...resources: Uri[]): Promise<INqlWorker> {
    const client = await this._getClient();

    if (this._worker) {
      await this._worker.withSyncedResources(resources);
    }

    return client;
  }
}
