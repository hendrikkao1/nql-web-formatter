export interface NqlWorker {
  format(uri: string): Promise<any>;
  getTokens(uri: string): Promise<
    {
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
    }[]
  >;
}
