import { worker } from "monaco-editor";
import { NqlWorker as INqlWorker } from "./monaco.contribution";
import Parser from "web-tree-sitter";

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

  async getTokens(uri: string): Promise<any> {
    const document = this._getDocumentText(uri);

    if (!document) {
      return Promise.reject("No document");
    }

    await Parser.init({
      locateFile(scriptName: string) {
        return `/libs/${scriptName}`;
      },
    });

    const Nql = await Parser.Language.load("/libs/tree-sitter-nql.wasm");

    const parser = new Parser();

    parser.setLanguage(Nql);

    const tree = parser.parse(document);

    const getNodeTokens = (node: Parser.SyntaxNode) => {
      const tokens: {
        type: string;
        text: string;
        modifiers: number;
        startPosition: {
          column: number;
          row: number;
        };
        endPosition: {
          column: number;
          row: number;
        };
      }[] = [];

      for (const child of node.children) {
        switch (child.type) {
          case "boolean":
          case "date_time":
          case "date":
          case "duration":
          case "float":
          case "int":
          case "string":
          case "table":
            tokens.push({
              type: child.type,
              startPosition: child.startPosition,
              endPosition: child.endPosition,
              text: child.text,
              modifiers: 0,
            });
            break;
          default:
            break;
        }

        tokens.push(...getNodeTokens(child));
      }

      return tokens;
    };

    const tokens = getNodeTokens(tree.rootNode);

    return tokens;
  }

  async format(uri: string): Promise<string> {
    const document = this._getDocumentText(uri);

    if (!document) {
      return Promise.reject("No document");
    }

    await Parser.init({
      locateFile(scriptName: string) {
        return `/libs/${scriptName}`;
      },
    });

    const Nql = await Parser.Language.load("/libs/tree-sitter-nql.wasm");

    const parser = new Parser();

    parser.setLanguage(Nql);

    const tree = parser.parse(document);

    const formatNode = (node: Parser.SyntaxNode): string => {
      switch (node.type) {
        case "query":
          return node.children.map(formatNode).join("");
        case "pipe":
          return "\n\n" + node.text.trim();
        case "and":
        case "by":
        case "duration":
        case "field":
        case "or":
        case "sort_order":
        case "table":
        case "time_frame":
          return "\n  " + node.text;
        case "addition":
        case "alias":
        case "division":
        case "equals":
        case "greater_than_or_equals":
        case "greater_than":
        case "in_array":
        case "less_than_or_equals":
        case "less_than":
        case "multiplication":
        case "not_equals":
        case "not_in_array":
        case "subtraction":
          return " " + node.text + " ";
        case "clause":
          return node.children.map(formatNode).join("");
        case "compute_clause":
        case "include_clause":
        case "list_clause":
        case "select_clause":
        case "sort_clause":
        case "summarize_clause":
        case "where_clause":
          return node.children.map(formatNode).join("");
        case ",":
          return node.text + " ";
        default:
          // Just clean up whitespace for the time being
          console.warn(`TODO: Unhandled node type: ${node.type}`);
          return node.text.replace(/\s+/g, " ");
      }
    };

    const formattedNql = tree.rootNode.children?.[0]
      ? formatNode(tree.rootNode.children[0]).trim()
      : document;

    return formattedNql;
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
}
