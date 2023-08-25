export interface IToken {
  type: string;
  text: string;
  startPosition: {
    row: number;
    column: number;
  };
  endPosition: {
    row: number;
    column: number;
  };
}

export interface IError {
  text: string;
  startPosition: {
    row: number;
    column: number;
  };
  endPosition: {
    row: number;
    column: number;
  };
}

export interface INqlWorker {
  format(uri: string): Promise<string>;
  getTokens(uri: string): Promise<IToken[]>;
  getParseErrors(uri: string): Promise<IError[]>;
}
