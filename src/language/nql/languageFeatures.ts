import { CancellationToken, Uri, editor, languages } from "monaco-editor";
import { NqlWorker } from "./monaco.contribution";

export abstract class Adapter {
  constructor(protected _worker: (...uris: Uri[]) => Promise<NqlWorker>) {}
}

const tokenTypes = [
  "constant",
  "number",
  "string",
  "strong",
  "variable",
  "type",
] as const;

const tokenTypeMap: Record<string, (typeof tokenTypes)[number]> = {
  boolean: "strong",
  date_time: "number",
  date: "number",
  duration: "number",
  enum: "strong",
  field_name: "variable",
  field_property: "variable",
  float: "number",
  int: "number",
  string: "string",
  table: "type",
};

export class TokenAdapter
  extends Adapter
  implements languages.DocumentSemanticTokensProvider
{
  public getLegend(): languages.SemanticTokensLegend {
    return {
      tokenTypes: tokenTypes as unknown as string[],
      tokenModifiers: [],
    };
  }

  public async provideDocumentSemanticTokens(
    model: editor.IReadOnlyModel,
    _: string | null,
    token: CancellationToken
  ): Promise<languages.SemanticTokens | undefined> {
    const resource = model.uri;
    const worker = await this._worker(resource);

    let tokens = [];

    try {
      tokens = await worker.getTokens(resource.toString());
    } catch (err) {
      console.error(err);
      return undefined;
    }

    /**
     * How to encode tokens
     *
     * Here is an example for encoding a file with 3 tokens in a uint32 array
     *
     * ```
     * { line: 2, startChar:  5, length: 3, tokenType: "property",  tokenModifiers: ["private", "static"] },
     * { line: 2, startChar: 10, length: 4, tokenType: "type",      tokenModifiers: [] },
     * { line: 5, startChar:  2, length: 7, tokenType: "class",     tokenModifiers: [] }
     * ```
     *
     * First of all, a legend must be devised. This legend must be provided up-front and capture all possible token types. For this example, we will choose the following legend which must be passed in when registering the provider:
     *
     * ```
     * tokenTypes: ['property', 'type', 'class'],
     * tokenModifiers: ['private', 'static']
     * ```
     *
     * The first transformation step is to encode tokenType and tokenModifiers as integers using the legend.
     * Token types are looked up by index, so a tokenType value of 1 means tokenTypes[1].
     * Multiple token modifiers can be set by using bit flags,
     * so a tokenModifier value of 3 is first viewed as binary 0b00000011,
     * which means [tokenModifiers[0], tokenModifiers[1]] because bits 0 and 1 are set.
     * Using this legend, the tokens now are:
     *
     * ```
     * { line: 2, startChar:  5, length: 3, tokenType: 0, tokenModifiers: 3 },
     * { line: 2, startChar: 10, length: 4, tokenType: 1, tokenModifiers: 0 },
     * { line: 5, startChar:  2, length: 7, tokenType: 2, tokenModifiers: 0 }
     * ```
     *
     * The next step is to represent each token relative to the previous token in the file. In this case, the second token is on the same line as the first token, so the startChar of the second token is made relative to the startChar of the first token, so it will be 10 - 5. The third token is on a different line than the second token, so the startChar of the third token will not be altered:
     *
     * ```
     * { deltaLine: 2, deltaStartChar: 5, length: 3, tokenType: 0, tokenModifiers: 3 },
     * { deltaLine: 0, deltaStartChar: 5, length: 4, tokenType: 1, tokenModifiers: 0 },
     * { deltaLine: 3, deltaStartChar: 2, length: 7, tokenType: 2, tokenModifiers: 0 }
     * ```
     *
     * Finally, the last step is to inline each of the 5 fields for a token in a single array, which is a memory friendly representation:
     *
     * ```
     * // 1st token,  2nd token,  3rd token
     * [  2,5,3,0,3,  0,5,4,1,0,  3,2,7,2,0 ]
     * ```
     */

    let prevLine = 0;
    let prevChar = 0;

    const semanticTokens = [];

    for (const token of tokens) {
      const lineDelta = token.startPosition.row - prevLine;
      const charDelta =
        lineDelta === 0
          ? token.startPosition.column - prevChar
          : token.startPosition.column;

      semanticTokens.push([
        lineDelta,
        charDelta,
        token.text.length,
        tokenTypes.indexOf(tokenTypeMap[token.type]),
        0,
      ]);

      prevLine = token.startPosition.row;
      prevChar = token.startPosition.column;
    }

    if (token.isCancellationRequested) {
      return undefined;
    }

    return {
      data: new Uint32Array(semanticTokens.flat()),
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