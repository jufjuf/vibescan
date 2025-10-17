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
  skippedFiles?: Array<{ file: string; reason: string }>;
}

export interface ScanOptions {
  directory: string;
  json?: boolean;
  fix?: boolean;
  ignore?: string[];
  rules?: RuleConfiguration;
  verbose?: boolean;
}

export interface RuleConfiguration {
  maxFunctionLength?: number;
  maxComplexity?: number;
  maxParameters?: number;
  maxNestingDepth?: number;
}

export interface VibeScanConfig {
  ignore?: string[];
  rules?: RuleConfiguration;
}

export const DEFAULT_RULES: Required<RuleConfiguration> = {
  maxFunctionLength: 50,
  maxComplexity: 10,
  maxParameters: 5,
  maxNestingDepth: 3
} as const;

export interface ComplexityMetrics {
  cyclomatic: number;
  cognitive: number;
  linesOfCode: number;
  parameters: number;
}
