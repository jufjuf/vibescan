import * as fs from 'fs';
import traverse from '@babel/traverse';
import { Issue, IssueSeverity, IssueCategory } from '../types';
import { ComplexityAnalyzer } from '../analyzers/complexity';

export class QualityScanner {
  private complexityAnalyzer: ComplexityAnalyzer;

  constructor() {
    this.complexityAnalyzer = new ComplexityAnalyzer();
  }

  scanFile(filePath: string, ast: any): Issue[] {
    const issues: Issue[] = [];
    const code = fs.readFileSync(filePath, 'utf-8');

    issues.push(...this.detectTODOs(filePath, code));
    issues.push(...this.detectComplexFunctions(filePath, ast));
    issues.push(...this.detectTooManyParameters(filePath, ast));
    issues.push(...this.detectDuplicateCode(filePath, code));

    return issues;
  }

  private detectTODOs(file: string, code: string): Issue[] {
    const issues: Issue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, idx) => {
      if (/\/\/\s*(TODO|FIXME|HACK|XXX)/i.test(line)) {
        issues.push({
          category: IssueCategory.CODE_QUALITY,
          severity: IssueSeverity.INFO,
          message: 'TODO/FIXME comment found',
          file,
          line: idx + 1,
          code: line.trim()
        });
      }
    });

    return issues;
  }

  private detectComplexFunctions(file: string, ast: any): Issue[] {
    const issues: Issue[] = [];

    traverse(ast, {
      FunctionDeclaration: (path) => {
        this.checkFunctionComplexity(path, file, issues);
      },
      ArrowFunctionExpression: (path) => {
        this.checkFunctionComplexity(path, file, issues);
      }
    });

    return issues;
  }

  private checkFunctionComplexity(path: any, file: string, issues: Issue[]): void {
    // Simplified - just count nested if statements
    const node = path.node;
    let complexity = 0;

    path.traverse({
      IfStatement: () => { complexity++; },
      ForStatement: () => { complexity++; },
      WhileStatement: () => { complexity++; }
    });

    if (complexity > 15) {
      const name = this.getFunctionName(node, path);
      issues.push({
        category: IssueCategory.CODE_QUALITY,
        severity: IssueSeverity.MEDIUM,
        message: `High complexity (${complexity} branches)`,
        file,
        line: node.loc?.start.line || 0,
        suggestion: `Simplify ${name}`
      });
    }
  }

  private detectTooManyParameters(file: string, ast: any): Issue[] {
    const issues: Issue[] = [];

    traverse(ast, {
      FunctionDeclaration: (path) => {
        this.checkParameters(path, file, issues);
      },
      ArrowFunctionExpression: (path) => {
        this.checkParameters(path, file, issues);
      }
    });

    return issues;
  }

  private checkParameters(path: any, file: string, issues: Issue[]): void {
    const node = path.node;
    const paramCount = node.params?.length || 0;

    if (paramCount > 5) {
      const name = this.getFunctionName(node, path);
      issues.push({
        category: IssueCategory.CODE_QUALITY,
        severity: IssueSeverity.LOW,
        message: `Too many parameters (${paramCount})`,
        file,
        line: node.loc?.start.line || 0,
        suggestion: `Consider using object parameter for ${name}`
      });
    }
  }

  private detectDuplicateCode(file: string, code: string): Issue[] {
    const issues: Issue[] = [];
    const lines = code.split('\n').filter(l => l.trim().length > 10);

    const lineCount = new Map<string, number[]>();

    lines.forEach((line, idx) => {
      const normalized = line.trim();
      if (!lineCount.has(normalized)) {
        lineCount.set(normalized, []);
      }
      lineCount.get(normalized)!.push(idx + 1);
    });

    lineCount.forEach((locations, line) => {
      if (locations.length > 2 && line.length > 30) {
        issues.push({
          category: IssueCategory.CODE_QUALITY,
          severity: IssueSeverity.LOW,
          message: `Duplicate code detected (${locations.length} occurrences)`,
          file,
          line: locations[0],
          suggestion: 'Extract to reusable function',
          code: line.substring(0, 60) + '...'
        });
      }
    });

    return issues;
  }

  private getFunctionName(node: any, path: any): string {
    if (node.id?.name) return node.id.name;
    if (path.parent?.id?.name) return path.parent.id.name;
    if (path.parent?.key?.name) return path.parent.key.name;
    return '<anonymous>';
  }
}
