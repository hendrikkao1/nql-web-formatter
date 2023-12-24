import { worker } from "monaco-editor-core";
import { INqlWorker } from "./monaco.contribution";
import { NQL, INQLParserError, INQLToken } from "./lib/nql"

const getLibPath = (fileName: string) => __BASE_PATH__ + `libs/${fileName}`;

const nql = new NQL({
  parserFile: getLibPath("tree-sitter-nql.wasm"),
  parserLocateFile: getLibPath
}); 

export interface ICreateData {}

export function create(
  ctx: worker.IWorkerContext,
  createData: ICreateData
): NqlWorker {
  return new NqlWorker(ctx, createData);
}

export class NqlWorker implements INqlWorker {
  private _ctx: worker.IWorkerContext;
  private _createData: ICreateData;

  constructor(ctx: worker.IWorkerContext, createData: ICreateData) {
    this._ctx = ctx;
    this._createData = createData;

    console.log(this._createData);
  }

  private _getDocumentText(uri: string): string | null {
    const models = this._ctx.getMirrorModels();
    for (const model of models) {
      if (model.uri.toString() === uri) {
        return model.getValue();
      }
    }
    return null;
  }

  async getTokens(uri: string): Promise<INQLToken[]> {
    const document = this._getDocumentText(uri);

    if (!document) {
      return Promise.reject("ERR: NO_DOCUMENT");
    }

    const tokens = await nql.getTokens(document);

    return tokens;
  }

  async format(uri: string): Promise<string> {
    const document = this._getDocumentText(uri);

    if (!document) {
      return Promise.reject("ERR: NO_DOCUMENT");
    }
  
    const formattedNql = await nql.formatContent({
      content: document,
      insertSpaces: true,
      tabSize: 2,
    });

    return formattedNql;
  }

  async getParseErrors(uri: string): Promise<INQLParserError[]> {
    const document = this._getDocumentText(uri);

    if (!document) {
      return Promise.reject("ERR: NO_DOCUMENT");
    }

    const errors = await nql.getContentParseErrors(document);

    return errors;
  }
}
