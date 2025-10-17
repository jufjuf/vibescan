import { ComplexityMetrics } from '../types';
import { ASTHelpers } from '../utils/ast-helpers';

export class ComplexityAnalyzer {
  calculateComplexity(ast: any): ComplexityMetrics {
    return {
      cyclomatic: ASTHelpers.calculateCyclomaticComplexity(ast),
      cognitive: ASTHelpers.calculateCognitiveComplexity(ast),
      linesOfCode: ASTHelpers.calculateLOC(ast),
      parameters: 0
    };
  }

  calculateNestingDepth(ast: any): number {
    return ASTHelpers.measureNestingDepth(ast);
  }
}
