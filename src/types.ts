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

/**
 * Specific issue types for type-safe fixer matching.
 * Replaces string-based message matching.
 */
export enum IssueType {
  // Security
  HARDCODED_API_KEY = 'HARDCODED_API_KEY',
  HARDCODED_SECRET = 'HARDCODED_SECRET',
  HARDCODED_PASSWORD = 'HARDCODED_PASSWORD',
  HARDCODED_TOKEN = 'HARDCODED_TOKEN',
  SQL_INJECTION = 'SQL_INJECTION',
  XSS_VULNERABILITY = 'XSS_VULNERABILITY',
  EVAL_USAGE = 'EVAL_USAGE',
  FUNCTION_CONSTRUCTOR = 'FUNCTION_CONSTRUCTOR',
  REDOS_VULNERABILITY = 'REDOS_VULNERABILITY',
  MISSING_INPUT_VALIDATION = 'MISSING_INPUT_VALIDATION',

  // Quality
  FUNCTION_TOO_LONG = 'FUNCTION_TOO_LONG',
  HIGH_COMPLEXITY = 'HIGH_COMPLEXITY',
  TOO_MANY_PARAMETERS = 'TOO_MANY_PARAMETERS',
  DUPLICATE_CODE = 'DUPLICATE_CODE',
  TODO_COMMENT = 'TODO_COMMENT',
  FIXME_COMMENT = 'FIXME_COMMENT',

  // AI Patterns
  MISSING_ERROR_HANDLING = 'MISSING_ERROR_HANDLING',
  MAGIC_NUMBER = 'MAGIC_NUMBER',
  DEEP_NESTING = 'DEEP_NESTING',
  INCONSISTENT_NAMING = 'INCONSISTENT_NAMING'
}

export interface Issue {
  category: IssueCategory;
  severity: IssueSeverity;
  type?: IssueType; // NEW: Type-safe issue identification (optional during migration)
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

/**
 * Severity weights for score calculation.
 * Higher weights = more penalty for that severity level.
 */
export const SEVERITY_WEIGHTS = {
  [IssueSeverity.CRITICAL]: 5,  // Most severe - major security vulnerabilities
  [IssueSeverity.HIGH]: 3,      // Significant issues requiring attention
  [IssueSeverity.MEDIUM]: 2,    // Moderate impact on code quality
  [IssueSeverity.LOW]: 1,       // Minor improvements
  [IssueSeverity.INFO]: 0       // Informational only
} as const;

/**
 * Default file extensions to scan.
 */
export const DEFAULT_FILE_EXTENSIONS = ['js', 'ts', 'jsx', 'tsx', 'mjs', 'cjs'] as const;

/**
 * Default ignore patterns for file scanning.
 */
export const DEFAULT_IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**'
] as const;

export interface ScoringConfig {
  maxScore: number;
  weights: typeof SEVERITY_WEIGHTS;
}

export interface VibeScanConfig {
  ignore?: string[];
  rules?: RuleConfiguration;
  scoring?: Partial<ScoringConfig>;          // NEW: Customizable scoring
  fileExtensions?: string[];                 // NEW: Configurable file types
  additionalIgnores?: string[];              // NEW: Additional ignore patterns
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
