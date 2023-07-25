import { initialize } from "monaco-editor-core/esm/vs/editor/editor.worker";
import { worker } from "monaco-editor";
import { ICreateData, create } from "./nqlWorker";

self.onmessage = () => {
  initialize((ctx: worker.IWorkerContext, createData: ICreateData) => {
    return create(ctx, createData);
  });
};
