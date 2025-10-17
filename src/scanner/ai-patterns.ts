import traverse from '@babel/traverse';
import { Issue, IssueSeverity, IssueCategory, DEFAULT_RULES } from '../types';
import { ASTAnalysis } from '../analyzers/ast-analyzer';
import { ComplexityAnalyzer } from '../analyzers/complexity';

export class AIPatternScanner {
  private complexityAnalyzer: ComplexityAnalyzer;

  constructor() {
    this.complexityAnalyzer = new ComplexityAnalyzer();
  }

  scanFile(filePath: string, analysis: ASTAnalysis): Issue[] {
    const issues: Issue[] = [];
    const ast = analysis.rawAST;

    issues.push(...this.detectLongFunctions(filePath, ast));
    issues.push(...this.detectHighComplexity(filePath, ast));
    issues.push(...this.detectMissingErrorHandling(filePath, ast));
    issues.push(...this.detectMagicNumbers(filePath, ast));
    issues.push(...this.detectDeepNesting(filePath, ast));
    issues.push(...this.detectInconsistentNaming(filePath, ast));

    return issues;
  }

  private detectLongFunctions(file: string, ast: any): Issue[] {
    const issues: Issue[] = [];

    traverse(ast, {
      FunctionDeclaration: (path) => {
        this.checkFunctionLength(path, file, issues);
      },
      ArrowFunctionExpression: (path) => {
        this.checkFunctionLength(path, file, issues);
      },
      FunctionExpression: (path) => {
        this.checkFunctionLength(path, file, issues);
      }
    });

    return issues;
  }

  private checkFunctionLength(path: any, file: string, issues: Issue[]): void {
    const node = path.node;
    if (!node.loc) return;

    const lines = node.loc.end.line - node.loc.start.line + 1;
    const name = this.getFunctionName(node, path);

    if (lines > DEFAULT_RULES.maxFunctionLength) {
      issues.push({
        category: IssueCategory.AI_PATTERN,
        severity: IssueSeverity.MEDIUM,
        message: `Function too long (${lines} lines)`,
        file,
        line: node.loc.start.line,
        suggestion: `Break ${name} into smaller functions`
      });
    }
  }

  private detectHighComplexity(file: string, ast: any): Issue[] {
    const issues: Issue[] = [];

    traverse(ast, {
      FunctionDeclaration: (path) => {
        this.checkComplexity(path, file, issues);
      },
      ArrowFunctionExpression: (path) => {
        this.checkComplexity(path, file, issues);
      }
    });

    return issues;
  }

  private checkComplexity(path: any, file: string, issues: Issue[]): void {
    const node = path.node;
    const complexity = this.calculateComplexity(path);
    const name = this.getFunctionName(node, path);

    if (complexity > DEFAULT_RULES.maxComplexity) {
      issues.push({
        category: IssueCategory.AI_PATTERN,
        severity: IssueSeverity.MEDIUM,
        message: `High complexity (${complexity})`,
        file,
        line: node.loc?.start.line || 0,
        suggestion: `Simplify ${name} to reduce complexity`
      });
    }
  }

  private calculateComplexity(path: any): number {
    let complexity = 1;

    path.traverse({
      IfStatement: () => { complexity++; },
      ConditionalExpression: () => { complexity++; },
      ForStatement: () => { complexity++; },
      WhileStatement: () => { complexity++; },
      DoWhileStatement: () => { complexity++; },
      SwitchCase: (innerPath: any) => {
        if (innerPath.node.test) complexity++;
      },
      LogicalExpression: (innerPath: any) => {
        if (innerPath.node.operator === '&&' || innerPath.node.operator === '||') {
          complexity++;
        }
      }
    });

    return complexity;
  }

  private detectMissingErrorHandling(file: string, ast: any): Issue[] {
    const issues: Issue[] = [];

    traverse(ast, {
      FunctionDeclaration: (path) => {
        this.checkErrorHandling(path, file, issues);
      },
      ArrowFunctionExpression: (path) => {
        this.checkErrorHandling(path, file, issues);
      }
    });

    return issues;
  }

  private checkErrorHandling(path: any, file: string, issues: Issue[]): void {
    const node = path.node;
    if (!node.async) return;

    let hasTryCatch = false;
    let hasAwait = false;

    path.traverse({
      TryStatement: () => {
        hasTryCatch = true;
      },
      AwaitExpression: () => {
        hasAwait = true;
      }
    });

    if (hasAwait && !hasTryCatch) {
      const name = this.getFunctionName(node, path);
      issues.push({
        category: IssueCategory.AI_PATTERN,
        severity: IssueSeverity.MEDIUM,
        message: 'Missing error handling in async function',
        file,
        line: node.loc?.start.line || 0,
        suggestion: `Add try/catch to ${name}`
      });
    }
  }

  private detectMagicNumbers(file: string, ast: any): Issue[] {
    const issues: Issue[] = [];

    traverse(ast, {
      NumericLiteral: (path) => {
        const value = path.node.value;

        // Ignore common acceptable values
        if ([0, 1, -1, 2, 10, 100].includes(value)) return;

        const parent = path.parent;
        const isConstDeclaration = parent.type === 'VariableDeclarator';

        if (!isConstDeclaration) {
          issues.push({
            category: IssueCategory.AI_PATTERN,
            severity: IssueSeverity.LOW,
            message: `Magic number: ${value}`,
            file,
            line: path.node.loc?.start.line || 0,
            suggestion: 'Extract to named constant'
          });
        }
      }
    });

    return issues;
  }

  private detectDeepNesting(file: string, ast: any): Issue[] {
    const issues: Issue[] = [];

    traverse(ast, {
      FunctionDeclaration: (path) => {
        const depth = this.measureNestingDepth(path);
        if (depth > DEFAULT_RULES.maxNestingDepth) {
          const name = this.getFunctionName(path.node, path);
          issues.push({
            category: IssueCategory.AI_PATTERN,
            severity: IssueSeverity.MEDIUM,
            message: `Deep nesting (${depth} levels)`,
            file,
            line: path.node.loc?.start.line || 0,
            suggestion: `Extract nested logic from ${name}`
          });
        }
      }
    });

    return issues;
  }

  private measureNestingDepth(path: any): number {
    let maxDepth = 0;
    let currentDepth = 0;

    path.traverse({
      enter: (innerPath: any) => {
        if (this.isNestingStatement(innerPath.node.type)) {
          currentDepth++;
          maxDepth = Math.max(maxDepth, currentDepth);
        }
      },
      exit: (innerPath: any) => {
        if (this.isNestingStatement(innerPath.node.type)) {
          currentDepth = Math.max(0, currentDepth - 1);
        }
      }
    });

    return maxDepth;
  }

  private isNestingStatement(type: string): boolean {
    return ['IfStatement', 'ForStatement', 'WhileStatement',
            'DoWhileStatement', 'SwitchStatement'].includes(type);
  }

  private detectInconsistentNaming(file: string, ast: any): Issue[] {
    const issues: Issue[] = [];
    const userIdentifiers: { name: string; style: string }[] = [];

    // Built-in identifiers to ignore
    const builtins = new Set([
      'console', 'process', 'require', 'exports', 'module', 'Buffer',
      'global', '__dirname', '__filename', 'setTimeout', 'setInterval',
      'clearTimeout', 'clearInterval', 'Promise', 'Array', 'Object',
      'String', 'Number', 'Boolean', 'Date', 'Math', 'JSON', 'Error',
      'Function', 'RegExp', 'Map', 'Set', 'Symbol', 'parseInt', 'parseFloat',
      'isNaN', 'isFinite', 'undefined', 'null', 'true', 'false', 'this',
      'arguments', 'eval', 'NaN', 'Infinity'
    ]);

    // Only check user-defined variables, functions, and classes
    traverse(ast, {
      VariableDeclarator: (path) => {
        if (path.node.id.type === 'Identifier' && !builtins.has(path.node.id.name)) {
          const name = path.node.id.name;
          const style = this.detectNamingStyle(name);
          if (style !== 'unknown') {
            userIdentifiers.push({ name, style });
          }
        }
      },
      FunctionDeclaration: (path) => {
        if (path.node.id && !builtins.has(path.node.id.name)) {
          const name = path.node.id.name;
          const style = this.detectNamingStyle(name);
          if (style !== 'unknown') {
            userIdentifiers.push({ name, style });
          }
        }
      },
      ClassDeclaration: (path) => {
        if (path.node.id) {
          const name = path.node.id.name;
          const style = this.detectNamingStyle(name);
          if (style !== 'unknown') {
            userIdentifiers.push({ name, style });
          }
        }
      }
    });

    // Only report if we have significant number of identifiers with real inconsistency
    if (userIdentifiers.length < 10) {
      return issues; // Too few to determine pattern
    }

    const styleCounts = new Map<string, number>();
    userIdentifiers.forEach(({ style }) => {
      styleCounts.set(style, (styleCounts.get(style) || 0) + 1);
    });

    // Report only if there are 3+ styles, or 2 styles with significant usage of both
    if (styleCounts.size >= 3) {
      const styleList = Array.from(styleCounts.keys()).join(', ');
      issues.push({
        category: IssueCategory.AI_PATTERN,
        severity: IssueSeverity.LOW,
        message: `Inconsistent naming conventions: ${styleList}`,
        file,
        line: 1,
        suggestion: 'Use consistent naming style throughout the file'
      });
    } else if (styleCounts.size === 2) {
      // Only report if both styles are used significantly (at least 30% each)
      const counts = Array.from(styleCounts.values());
      const minCount = Math.min(...counts);
      const total = userIdentifiers.length;
      if (minCount / total >= 0.3) {
        const styleList = Array.from(styleCounts.keys()).join(' and ');
        issues.push({
          category: IssueCategory.AI_PATTERN,
          severity: IssueSeverity.LOW,
          message: `Mixed naming conventions: ${styleList}`,
          file,
          line: 1,
          suggestion: 'Choose one naming style and use it consistently'
        });
      }
    }

    return issues;
  }

  private getFunctionName(node: any, path: any): string {
    if (node.id?.name) return node.id.name;
    if (path.parent?.id?.name) return path.parent.id.name;
    if (path.parent?.key?.name) return path.parent.key.name;
    return '<anonymous>';
  }

  private detectNamingStyle(name: string): string {
    if (/^[a-z][a-zA-Z0-9]*$/.test(name)) return 'camelCase';
    if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) return 'PascalCase';
    if (/^[a-z][a-z0-9_]*$/.test(name)) return 'snake_case';
    if (/^[A-Z][A-Z0-9_]*$/.test(name)) return 'SCREAMING_SNAKE_CASE';
    return 'unknown'; // Ignore names that don't match any convention
  }
}
