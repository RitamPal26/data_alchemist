export interface ClientRow {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number;
  RequestedTaskIDs: string;
  GroupTag: string;
  AttributesJSON?: string;
}

export interface TaskRow {
  id: string;
  name: string;
  phaseCount: number;
  maxConcurrent: number;
}

export type CSVRow = ClientRow | TaskRow | Record<string, any>;
export type Rule = any;
export type WeightMap = Record<string, number>;
