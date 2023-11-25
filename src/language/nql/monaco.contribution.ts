import { INQLParserError, INQLToken } from "./lib/nql"

export interface INqlWorker {
  format(uri: string): Promise<string>;
  getTokens(uri: string): Promise<INQLToken[]>;
  getParseErrors(uri: string): Promise<INQLParserError[]>;
}
