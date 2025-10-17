export enum IssueSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO'
}

export enum IssueCategory {
  SECURITY = 'Security',
  AI_PATTERN = 'AI Pattern',
  CODE_QUALITY = 'Code Quality'
}

export interface Issue {
  category: IssueCategory;
  severity: IssueSeverity;
  message: string;
  file: string;
  line: number;
  column?: number;
  suggestion?: string;
  code?: string;
}

export interface ScanResult {
  filesScanned: number;
  totalIssues: number;
  issues: Issue[];
  securityScore: number;
  qualityScore: number;
  aiPatternScore: number;
}

export interface ScanOptions {
  directory: string;
  json?: boolean;
  fix?: boolean;
  ignore?: string[];
}

export interface ComplexityMetrics {
  cyclomatic: number;
  cognitive: number;
  linesOfCode: number;
  parameters: number;
}
