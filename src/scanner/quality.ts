import traverse from '@babel/traverse';
import { Issue, IssueSeverity, IssueCategory, IssueType, DEFAULT_RULES } from '../types';
import { ComplexityAnalyzer } from '../analyzers/complexity';
import { ASTAnalysis } from '../analyzers/ast-analyzer';
import { ASTHelpers } from '../utils/ast-helpers';

export class QualityScanner {
  private complexityAnalyzer: ComplexityAnalyzer;

  constructor() {
    this.complexityAnalyzer = new ComplexityAnalyzer();
  }

  scanFile(filePath: string, analysis: ASTAnalysis): Issue[] {
    const issues: Issue[] = [];
    const code = analysis.sourceCode;
    const ast = analysis.rawAST;

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
      const match = line.match(/\/\/\s*(TODO|FIXME|HACK|XXX)/i);
      if (match) {
        const keyword = match[1].toUpperCase();
        const type = (keyword === 'TODO' || keyword === 'HACK' || keyword === 'XXX')
          ? IssueType.TODO_COMMENT
          : IssueType.FIXME_COMMENT;

        issues.push({
          category: IssueCategory.CODE_QUALITY,
          severity: IssueSeverity.INFO,
          type,
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
    const node = path.node;
    const complexity = ASTHelpers.calculateCyclomaticComplexity(node);

    if (complexity > DEFAULT_RULES.maxComplexity * 1.5) {
      const name = ASTHelpers.getFunctionName(node, path);
      issues.push({
        category: IssueCategory.CODE_QUALITY,
        severity: IssueSeverity.MEDIUM,
        type: IssueType.HIGH_COMPLEXITY,
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

    if (paramCount > DEFAULT_RULES.maxParameters) {
      const name = ASTHelpers.getFunctionName(node, path);
      issues.push({
        category: IssueCategory.CODE_QUALITY,
        severity: IssueSeverity.LOW,
        type: IssueType.TOO_MANY_PARAMETERS,
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
          type: IssueType.DUPLICATE_CODE,
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
}
