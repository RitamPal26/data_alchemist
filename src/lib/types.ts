export interface ClientRow {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number;
  RequestedTaskIDs: string;
  GroupTag: string;
  AttributesJSON?: string;
}

export interface ValidationError {
  rowIndex: number;
  column: string;
  message: string;
  severity: "error" | "warning";
}

export interface TaskRow {
  id: string;
  name: string;
  phaseCount: number;
  maxConcurrent: number;
}

export interface CSVRow {
  [key: string]: string | number | undefined;
  AttributesJSON?: string;
  PriorityLevel?: string;
  RequestedTaskIDs?: string;
}

export interface TaskRow extends CSVRow {
  // Add specific task properties if needed
}

export interface ClientRow extends CSVRow {
  RequestedTaskIDs?: string;
  // Add other client-specific properties
}

export interface WorkerRow extends CSVRow {
  Skills?: string;
  // Add other worker-specific properties
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface ParsedData {
  headers: string[];
  rows: Record<string, string | number>[];
  errors: ValidationError[];
}

export interface DraftRule {
  id: string;              // uuid
  trigger: string;         // e.g. "onUpload"
  conditions: Array<{ lhs: string; op: string; rhs: string | number | boolean }>;
  actions: string[];       // e.g. ["markInvalid", "setPriority:high"]
  weight?: number;         // optional, ties into your WeightMap
}


export type Rule = any;
export type WeightMap = Record<string, number>;
