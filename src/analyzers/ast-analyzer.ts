import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as fs from 'fs';

export interface FunctionInfo {
  name: string;
  line: number;
  column: number;
  linesOfCode: number;
  parameters: number;
  hasErrorHandling: boolean;
  isAsync: boolean;
}

export interface ASTAnalysis {
  functions: FunctionInfo[];
  rawAST: any;
}

export class ASTAnalyzer {
  parseFile(filePath: string): ASTAnalysis | null {
    try {
      const code = fs.readFileSync(filePath, 'utf-8');
      return this.parseCode(code);
    } catch (error) {
      return null;
    }
  }

  parseCode(code: string): ASTAnalysis | null {
    try {
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx']
      });

      const functions: FunctionInfo[] = [];

      traverse(ast, {
        FunctionDeclaration: (path) => {
          this.extractFunctionInfo(path, functions);
        },
        ArrowFunctionExpression: (path) => {
          this.extractFunctionInfo(path, functions);
        },
        FunctionExpression: (path) => {
          this.extractFunctionInfo(path, functions);
        }
      });

      return { functions, rawAST: ast };
    } catch (error) {
      return null;
    }
  }

  private extractFunctionInfo(path: any, functions: FunctionInfo[]): void {
    const node = path.node;
    const name = this.getFunctionName(node, path);
    const line = node.loc?.start.line || 0;
    const column = node.loc?.start.column || 0;
    const linesOfCode = this.calculateLOC(node);
    const parameters = node.params?.length || 0;
    const isAsync = node.async || false;
    const hasErrorHandling = this.checkErrorHandling(path);

    functions.push({
      name,
      line,
      column,
      linesOfCode,
      parameters,
      hasErrorHandling,
      isAsync
    });
  }

  private getFunctionName(node: any, path: any): string {
    if (node.id?.name) return node.id.name;
    if (path.parent?.id?.name) return path.parent.id.name;
    if (path.parent?.key?.name) return path.parent.key.name;
    return '<anonymous>';
  }

  private calculateLOC(node: any): number {
    if (!node.loc) return 0;
    return node.loc.end.line - node.loc.start.line + 1;
  }

  private checkErrorHandling(path: any): boolean {
    let hasTryCatch = false;

    path.traverse({
      TryStatement: () => {
        hasTryCatch = true;
      }
    });

    return hasTryCatch;
  }

  calculateCyclomaticComplexity(node: any): number {
    let complexity = 1;

    traverse(node, {
      IfStatement: () => complexity++,
      ConditionalExpression: () => complexity++,
      ForStatement: () => complexity++,
      WhileStatement: () => complexity++,
      DoWhileStatement: () => complexity++,
      SwitchCase: (path) => {
        if (path.node.test) complexity++;
      },
      LogicalExpression: (path) => {
        if (path.node.operator === '&&' || path.node.operator === '||') {
          complexity++;
        }
      }
    });

    return complexity;
  }
}
