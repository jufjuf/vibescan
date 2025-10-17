import traverse from '@babel/traverse';
import { ComplexityMetrics } from '../types';

export class ComplexityAnalyzer {
  calculateComplexity(ast: any): ComplexityMetrics {
    return {
      cyclomatic: this.calculateCyclomatic(ast),
      cognitive: this.calculateCognitive(ast),
      linesOfCode: this.calculateLOC(ast),
      parameters: 0
    };
  }

  private calculateCyclomatic(ast: any): number {
    let complexity = 1;

    traverse(ast, {
      IfStatement: () => { complexity++; },
      ConditionalExpression: () => { complexity++; },
      ForStatement: () => { complexity++; },
      WhileStatement: () => { complexity++; },
      DoWhileStatement: () => { complexity++; },
      SwitchCase: (path) => {
        if (path.node.test) complexity++;
      },
      LogicalExpression: (path) => {
        if (path.node.operator === '&&' || path.node.operator === '||') {
          complexity++;
        }
      },
      CatchClause: () => { complexity++; }
    });

    return complexity;
  }

  private calculateCognitive(ast: any): number {
    let cognitive = 0;
    let nestingLevel = 0;

    traverse(ast, {
      enter: (path) => {
        if (this.isNestingIncrement(path.node.type)) {
          nestingLevel++;
        }
        if (this.addsCognitiveLoad(path.node.type)) {
          cognitive += nestingLevel > 0 ? nestingLevel : 1;
        }
      },
      exit: (path) => {
        if (this.isNestingIncrement(path.node.type)) {
          nestingLevel = Math.max(0, nestingLevel - 1);
        }
      }
    });

    return cognitive;
  }

  private isNestingIncrement(type: string): boolean {
    return ['IfStatement', 'ForStatement', 'WhileStatement',
            'DoWhileStatement', 'SwitchStatement'].includes(type);
  }

  private addsCognitiveLoad(type: string): boolean {
    return ['IfStatement', 'ConditionalExpression', 'ForStatement',
            'WhileStatement', 'SwitchCase', 'CatchClause'].includes(type);
  }

  private calculateLOC(ast: any): number {
    if (!ast.loc) return 0;
    return ast.loc.end.line - ast.loc.start.line + 1;
  }

  calculateNestingDepth(ast: any): number {
    let maxDepth = 0;
    let currentDepth = 0;

    traverse(ast, {
      enter: (path) => {
        if (this.isNestingIncrement(path.node.type)) {
          currentDepth++;
          maxDepth = Math.max(maxDepth, currentDepth);
        }
      },
      exit: (path) => {
        if (this.isNestingIncrement(path.node.type)) {
          currentDepth = Math.max(0, currentDepth - 1);
        }
      }
    });

    return maxDepth;
  }
}
