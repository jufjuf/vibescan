import { ScanResult, Issue } from '../types';
import { BaseFixer } from './base-fixer';
import { SecretFixer } from './secret-fixer';
import { MagicNumberFixer } from './magic-number-fixer';
import { ErrorHandlerFixer } from './error-handler-fixer';
import { CleanupFixer } from './cleanup-fixer';
import * as fs from 'fs';
import * as path from 'path';

export interface FixReport {
  totalFixed: number;
  filesModified: number;
  changes: string[];
  backupDir: string;
  errors: string[];
}

export interface FixOptions {
  dryRun?: boolean;
  createBackup?: boolean;
  skipConfirmation?: boolean;
}

export class FixerOrchestrator {
  private fixers: BaseFixer[];

  constructor() {
    this.fixers = [
      new SecretFixer(),
      new MagicNumberFixer(),
      new ErrorHandlerFixer(),
      new CleanupFixer()
    ];
  }

  async fixIssues(
    scanResult: ScanResult,
    options: FixOptions = {}
  ): Promise<FixReport> {
    const {
      dryRun = false,
      createBackup = true,
      skipConfirmation = false
    } = options;

    const report: FixReport = {
      totalFixed: 0,
      filesModified: 0,
      changes: [],
      backupDir: '',
      errors: []
    };

    // Group issues by file
    const issuesByFile = this.groupIssuesByFile(scanResult.issues);

    // Create backup directory if needed
    if (createBackup && !dryRun) {
      report.backupDir = this.createBackupDir();
    }

    // Process each file
    for (const [filePath, issues] of issuesByFile.entries()) {
      try {
        const result = await this.fixFile(
          filePath,
          issues,
          dryRun,
          report.backupDir // Pass backup dir (will be empty string if not created)
        );

        if (result.modified) {
          report.filesModified++;
          report.totalFixed += result.fixedCount;
          report.changes.push(...result.changes);
        }
      } catch (error) {
        const errorMsg = `Failed to fix ${filePath}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        report.errors.push(errorMsg);
      }
    }

    return report;
  }

  private async fixFile(
    filePath: string,
    issues: Issue[],
    dryRun: boolean,
    backupDir: string
  ): Promise<{ modified: boolean; fixedCount: number; changes: string[] }> {
    // Read original file
    const originalCode = fs.readFileSync(filePath, 'utf-8');
    let currentCode = originalCode;
    let modified = false;
    let fixedCount = 0;
    const changes: string[] = [];

    // Group issues by fixer to avoid applying same fixer multiple times
    const issuesByFixer = new Map<BaseFixer, Issue[]>();

    for (const issue of issues) {
      for (const fixer of this.fixers) {
        if (fixer.canFix(issue)) {
          if (!issuesByFixer.has(fixer)) {
            issuesByFixer.set(fixer, []);
          }
          issuesByFixer.get(fixer)!.push(issue);
          break; // Only use the first matching fixer for each issue
        }
      }
    }

    // Apply each fixer once per file
    for (const [fixer, fixerIssues] of issuesByFixer) {
      try {
        // Use the first issue as representative (fixers process the whole file anyway)
        const result = await fixer.fix(filePath, fixerIssues[0], currentCode);

        if (result.success && result.fixedCode !== currentCode) {
          currentCode = result.fixedCode;
          modified = true;
          fixedCount += fixerIssues.length;

          // Add changes with file context
          for (const change of result.changes) {
            changes.push(`${path.basename(filePath)}: ${change}`);
          }
        }
      } catch (error) {
        // Continue to next fixer if this one fails
        console.error(`Fixer ${fixer.name} failed for ${filePath}:`, error);
      }
    }

    // Write changes if not dry run
    if (modified && !dryRun) {
      // Create backup if backup directory was provided
      if (backupDir && backupDir.length > 0) {
        this.createBackup(filePath, originalCode, backupDir);
      }

      // Write fixed code
      fs.writeFileSync(filePath, currentCode, 'utf-8');
    }

    return { modified, fixedCount, changes };
  }

  private groupIssuesByFile(issues: Issue[]): Map<string, Issue[]> {
    const map = new Map<string, Issue[]>();

    for (const issue of issues) {
      const existing = map.get(issue.file) || [];
      existing.push(issue);
      map.set(issue.file, existing);
    }

    return map;
  }

  private createBackupDir(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), '.vibescan-backup', timestamp);

    fs.mkdirSync(backupDir, { recursive: true });

    return backupDir;
  }

  private createBackup(filePath: string, content: string, backupDir: string): void {
    const relativePath = path.relative(process.cwd(), filePath);
    const backupPath = path.join(backupDir, relativePath);

    // Create directory structure
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });

    // Write backup
    fs.writeFileSync(backupPath, content, 'utf-8');
  }

  /**
   * Get list of issues that can be auto-fixed
   */
  getFixableIssues(scanResult: ScanResult): Issue[] {
    return scanResult.issues.filter(issue =>
      this.fixers.some(fixer => fixer.canFix(issue))
    );
  }

  /**
   * Get count of fixable issues by category
   */
  getFixableStats(scanResult: ScanResult): {
    total: number;
    byFixer: Map<string, number>;
  } {
    const fixableIssues = this.getFixableIssues(scanResult);
    const byFixer = new Map<string, number>();

    for (const issue of fixableIssues) {
      for (const fixer of this.fixers) {
        if (fixer.canFix(issue)) {
          byFixer.set(fixer.name, (byFixer.get(fixer.name) || 0) + 1);
          break; // Count each issue only once
        }
      }
    }

    return {
      total: fixableIssues.length,
      byFixer
    };
  }
}

export * from './base-fixer';
export { SecretFixer } from './secret-fixer';
export { MagicNumberFixer } from './magic-number-fixer';
export { ErrorHandlerFixer } from './error-handler-fixer';
export { CleanupFixer } from './cleanup-fixer';
