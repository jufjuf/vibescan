import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { ASTAnalyzer } from '../analyzers/ast-analyzer';
import { SecurityScanner } from './security';
import { AIPatternScanner } from './ai-patterns';
import { QualityScanner } from './quality';
import {
  ScanResult,
  ScanOptions,
  Issue,
  IssueCategory,
  IssueSeverity,
  SEVERITY_WEIGHTS,
  DEFAULT_FILE_EXTENSIONS,
  DEFAULT_IGNORE_PATTERNS
} from '../types';
import { ErrorHandler } from '../utils/error-handler';

export class Scanner {
  private astAnalyzer: ASTAnalyzer;
  private securityScanner: SecurityScanner;
  private aiPatternScanner: AIPatternScanner;
  private qualityScanner: QualityScanner;
  private skippedFiles: Array<{ file: string; reason: string }> = [];

  constructor() {
    this.astAnalyzer = new ASTAnalyzer();
    this.securityScanner = new SecurityScanner();
    this.aiPatternScanner = new AIPatternScanner();
    this.qualityScanner = new QualityScanner();
  }

  async scan(options: ScanOptions): Promise<ScanResult> {
    const files = await this.findFiles(options.directory);
    const allIssues: Issue[] = [];
    let filesScanned = 0;
    this.skippedFiles = [];

    for (const file of files) {
      if (this.shouldIgnore(file, options.ignore || [])) {
        continue;
      }

      if (options.verbose) {
        process.stdout.write(`\rScanning: ${filesScanned + 1}/${files.length} files...`);
      }

      const issues = this.scanFile(file, options);
      allIssues.push(...issues);
      filesScanned++;
    }

    if (options.verbose && filesScanned > 0) {
      process.stdout.write('\n');
    }

    return this.buildResult(filesScanned, allIssues);
  }

  private async findFiles(directory: string): Promise<string[]> {
    // Use centralized file extensions
    const patterns = DEFAULT_FILE_EXTENSIONS.map(ext => `**/*.${ext}`);

    const files: string[] = [];

    for (const pattern of patterns) {
      const matches = await glob(path.join(directory, pattern), {
        // Use centralized ignore patterns
        ignore: [...DEFAULT_IGNORE_PATTERNS]
      });
      files.push(...matches);
    }

    return [...new Set(files)];
  }

  private scanFile(filePath: string, options: ScanOptions): Issue[] {
    try {
      const analysis = this.astAnalyzer.parseFile(filePath);
      if (!analysis) {
        if (options.verbose) {
          ErrorHandler.logWarning(`Could not parse ${filePath} - skipping`);
        }
        this.skippedFiles.push({ file: filePath, reason: 'Parse failed' });
        return [];
      }

      const issues: Issue[] = [];

      issues.push(...this.securityScanner.scanFile(filePath, analysis));
      issues.push(...this.aiPatternScanner.scanFile(filePath, analysis));
      issues.push(...this.qualityScanner.scanFile(filePath, analysis));

      return issues;
    } catch (error) {
      if (options.verbose) {
        ErrorHandler.logError(`Scanning ${filePath}`, error);
      }
      this.skippedFiles.push({
        file: filePath,
        reason: ErrorHandler.formatError(error)
      });
      return [];
    }
  }

  private shouldIgnore(file: string, ignorePatterns: string[]): boolean {
    return ignorePatterns.some(pattern => file.includes(pattern));
  }

  private buildResult(filesScanned: number, issues: Issue[]): ScanResult {
    const securityIssues = issues.filter(i => i.category === IssueCategory.SECURITY);
    const aiPatternIssues = issues.filter(i => i.category === IssueCategory.AI_PATTERN);
    const qualityIssues = issues.filter(i => i.category === IssueCategory.CODE_QUALITY);

    return {
      filesScanned,
      totalIssues: issues.length,
      issues,
      securityScore: this.calculateScore(securityIssues, filesScanned),
      qualityScore: this.calculateScore(qualityIssues, filesScanned),
      aiPatternScore: this.calculateScore(aiPatternIssues, filesScanned),
      skippedFiles: this.skippedFiles.length > 0 ? this.skippedFiles : undefined
    };
  }

  private calculateScore(issues: Issue[], filesScanned: number): number {
    if (filesScanned === 0) return 10;

    // Use centralized severity weights
    let penalties = 0;

    issues.forEach(issue => {
      const weight = SEVERITY_WEIGHTS[issue.severity as IssueSeverity];
      penalties += weight;
    });

    const score = Math.max(0, 10 - (penalties / filesScanned));
    return Math.round(score * 10) / 10;
  }
}
