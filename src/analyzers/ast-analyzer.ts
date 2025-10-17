import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as fs from 'fs';
import { ASTHelpers } from '../utils/ast-helpers';

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
  sourceCode: string;
}

export class ASTAnalyzer {
  parseFile(filePath: string): ASTAnalysis | null {
    try {
      const code = fs.readFileSync(filePath, 'utf-8');
      const result = this.parseCode(code);
      return result ? { ...result, sourceCode: code } : null;
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

      return { functions, rawAST: ast, sourceCode: code };
    } catch (error) {
      return null;
    }
  }

  private extractFunctionInfo(path: any, functions: FunctionInfo[]): void {
    const node = path.node;
    const name = ASTHelpers.getFunctionName(node, path);
    const line = node.loc?.start.line || 0;
    const column = node.loc?.start.column || 0;
    const linesOfCode = ASTHelpers.calculateLOC(node);
    const parameters = node.params?.length || 0;
    const isAsync = node.async || false;
    const hasErrorHandling = ASTHelpers.hasErrorHandling(path);

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

  calculateCyclomaticComplexity(node: any): number {
    return ASTHelpers.calculateCyclomaticComplexity(node);
  }
}
