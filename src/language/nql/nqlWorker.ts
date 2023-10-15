import { worker } from "monaco-editor-core";
import { IError, INqlWorker, IToken } from "./monaco.contribution";
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
  private _parser: Parser | null;

  constructor(ctx: worker.IWorkerContext, createData: ICreateData) {
    this._ctx = ctx;
    this._createData = createData;
    this._parser = null;

    // TODO: Remove this
    console.log(this._createData);
  }

  private async _getParser(): Promise<Parser> {
    if (this._parser) {
      return this._parser;
    }

    const getLibPath = (fileName: string) => __BASE_PATH__ + `libs/${fileName}`;

    await Parser.init({
      locateFile(scriptName: string) {
        return getLibPath(scriptName);
      },
    });

    const Nql = await Parser.Language.load(getLibPath("tree-sitter-nql.wasm"));

    const parser = new Parser();

    parser.setLanguage(Nql);

    this._parser = parser;

    return parser;
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

  async getTokens(uri: string): Promise<IToken[]> {
    const document = this._getDocumentText(uri);

    if (!document) {
      return Promise.reject("No document");
    }

    const parser = await this._getParser();

    const tree = parser.parse(document);

    const isUserDefinedField = (node: Parser.SyntaxNode): boolean => {
      let isFound: boolean = false;

      const findDeclaration = (treeNode: Parser.SyntaxNode): boolean => {
        for (const child of treeNode.children) {
          switch (child.type) {
            case "summarize_clause":
            case "compute_clause":
              child.children.forEach((c) => {
                if (c.type === "field_name" && c.text === node.text) {
                  isFound = true;
                }
              });
              break;
            default:
              break;
          }

          findDeclaration(child);
        }

        return isFound;
      };

      return findDeclaration(tree.rootNode);
    };

    const getNodeTokens = (node: Parser.SyntaxNode) => {
      const tokens: {
        type: string;
        text: string;
        modifiers: string[];
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
          case "enum":
          case "boolean":
          case "date_time":
          case "date":
          case "duration":
          case "float":
          case "int":
          case "string":
          case "table":
          case "aggregate_function":
          case "aggregate_field":
          case "field_property":
          case "byte":
            tokens.push({
              type: child.type,
              startPosition: child.startPosition,
              endPosition: child.endPosition,
              text: child.text,
              modifiers: [],
            });
            break;
          case "field_name":
            tokens.push({
              type: child.type,
              startPosition: child.startPosition,
              endPosition: child.endPosition,
              text: child.text,
              // TODO: Can this be done in the parser?
              modifiers: isUserDefinedField(child) ? [] : ["defaultLibrary"],
            });
            break;
          default:
            console.log("Unhandled node type: ", child.type);
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

    const parser = await this._getParser();

    const tree = parser.parse(document);

    const checkIfNodeHasParent = (
      node: Parser.SyntaxNode,
      type: string
    ): boolean => {
      if (!node.parent) {
        return false;
      }

      if (node.parent.type === type) {
        return true;
      }

      return checkIfNodeHasParent(node.parent, type);
    };

    const checkIfNodeHasPreviousSibling = (
      node: Parser.SyntaxNode,
      type: string
    ): boolean => {
      if (!node.previousSibling) {
        return false;
      }

      if (node.previousSibling.type === type) {
        return true;
      }

      return checkIfNodeHasPreviousSibling(node.previousSibling, type);
    };

    const padLeft = (str: string, len: number, char: string) =>
      char.repeat(len) + str;

    const padLeftSpace = (str: string, len: number = 1) =>
      padLeft(str, len, " ");

    const padLeftNewLine = (str: string, len: number = 1) =>
      padLeft(str, len, "\n");

    const padRight = (str: string, len: number, char: string) =>
      str + char.repeat(len);

    const padRightSpace = (str: string, len: number = 1) =>
      padRight(str, len, " ");

    const padRightNewLine = (str: string, len: number = 1) =>
      padRight(str, len, "\n");

    function joinLeafNodes(node: Parser.SyntaxNode): string {
      const type = node.type;
      const text = node.text.trim();

      switch (type) {
        case "field_name":
          if (checkIfNodeHasParent(node, "expression")) {
            return text;
          }
          return padLeftNewLine(padLeftSpace(text, 2));
        case "time_frame":
          return padLeftNewLine(padLeftSpace(text, 2));
        case "clause":
          return padLeftNewLine(node.children.map(joinLeafNodes).join(""), 2);
        case "compute_clause":
        case "include_clause":
        case "list_clause":
        case "limit_clause":
        case "select_clause":
        case "sort_clause":
        case "summarize_clause":
        case "where_clause":
        case "with_clause":
          return padLeftSpace(node.children.map(joinLeafNodes).join(""));
        case "table":
          return padLeftNewLine(padLeftSpace(text, 2));
        case "and":
        case "or":
          return padLeftNewLine(padLeftSpace(text, 2));
        case "by":
          return padLeftNewLine(padLeftSpace(padRightSpace(text), 2));
        case "limit":
          return padRightSpace(text);
        case "sort_order":
          return padLeftNewLine(padLeftSpace(text, 2));
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
        case "addition":
          return padRightSpace(padLeftSpace(text));
        case "duration":
        case "byte":
        case "int":
        case "string":
          return text;
        case ",":
          return padRightSpace(text);
        case "pipe":
          return text;
      }

      if (!node.children.length) {
        return text;
      }

      const childValues = node.children.map(joinLeafNodes);

      return childValues.join("");
    }

    const formattedNql = joinLeafNodes(tree.rootNode);

    // Remove all dangling whitespace after coma if the next character is a newline
    const cleanFormattedNql = formattedNql.replace(/,\s\n/g, ",\n").trim();

    return cleanFormattedNql;
  }

  async getParseErrors(uri: string): Promise<IError[]> {
    const document = this._getDocumentText(uri);

    if (!document) {
      return Promise.reject("No document");
    }

    const parser = await this._getParser();

    const tree = parser.parse(document);

    if (!tree.rootNode.hasError()) {
      return [];
    }

    const getNodeErrors = (node: Parser.SyntaxNode) => {
      const errors: {
        text: string;
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
          case "ERROR":
            errors.push({
              text: child.text,
              startPosition: child.startPosition,
              endPosition: child.endPosition,
            });
            break;
          default:
            break;
        }

        errors.push(...getNodeErrors(child));
      }

      return errors;
    };

    return getNodeErrors(tree.rootNode);
  }
}
