import { Issue } from '../types';

export interface FixResult {
  success: boolean;
  originalCode: string;
  fixedCode: string;
  changes: string[];
  error?: string;
}

export abstract class BaseFixer {
  abstract name: string;
  abstract canFix(issue: Issue): boolean;
  abstract fix(filePath: string, issue: Issue, sourceCode: string): Promise<FixResult>;

  protected createFailureResult(originalCode: string, error: string): FixResult {
    return {
      success: false,
      originalCode,
      fixedCode: originalCode,
      changes: [],
      error
    };
  }

  protected createSuccessResult(
    originalCode: string,
    fixedCode: string,
    changes: string[]
  ): FixResult {
    return {
      success: true,
      originalCode,
      fixedCode,
      changes
    };
  }
}
