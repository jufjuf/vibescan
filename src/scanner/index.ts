import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { ASTAnalyzer } from '../analyzers/ast-analyzer';
import { SecurityScanner } from './security';
import { AIPatternScanner } from './ai-patterns';
import { QualityScanner } from './quality';
import { ScanResult, ScanOptions, Issue, IssueCategory } from '../types';

export class Scanner {
  private astAnalyzer: ASTAnalyzer;
  private securityScanner: SecurityScanner;
  private aiPatternScanner: AIPatternScanner;
  private qualityScanner: QualityScanner;

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

    for (const file of files) {
      if (this.shouldIgnore(file, options.ignore || [])) {
        continue;
      }

      const issues = this.scanFile(file);
      allIssues.push(...issues);
      filesScanned++;
    }

    return this.buildResult(filesScanned, allIssues);
  }

  private async findFiles(directory: string): Promise<string[]> {
    const patterns = [
      '**/*.js',
      '**/*.ts',
      '**/*.jsx',
      '**/*.tsx'
    ];

    const files: string[] = [];

    for (const pattern of patterns) {
      const matches = await glob(path.join(directory, pattern), {
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/.next/**',
          '**/coverage/**'
        ]
      });
      files.push(...matches);
    }

    return [...new Set(files)];
  }

  private scanFile(filePath: string): Issue[] {
    try {
      const analysis = this.astAnalyzer.parseFile(filePath);
      if (!analysis) {
        return [];
      }

      const issues: Issue[] = [];

      issues.push(...this.securityScanner.scanFile(filePath, analysis.rawAST));
      issues.push(...this.aiPatternScanner.scanFile(filePath, analysis.rawAST));
      issues.push(...this.qualityScanner.scanFile(filePath, analysis.rawAST));

      return issues;
    } catch (error) {
      // Skip files that can't be parsed
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
      aiPatternScore: this.calculateScore(aiPatternIssues, filesScanned)
    };
  }

  private calculateScore(issues: Issue[], filesScanned: number): number {
    if (filesScanned === 0) return 10;

    const criticalWeight = 5;
    const highWeight = 3;
    const mediumWeight = 2;
    const lowWeight = 1;

    let penalties = 0;

    issues.forEach(issue => {
      switch (issue.severity) {
        case 'CRITICAL':
          penalties += criticalWeight;
          break;
        case 'HIGH':
          penalties += highWeight;
          break;
        case 'MEDIUM':
          penalties += mediumWeight;
          break;
        case 'LOW':
          penalties += lowWeight;
          break;
      }
    });

    const score = Math.max(0, 10 - (penalties / filesScanned));
    return Math.round(score * 10) / 10;
  }
}
