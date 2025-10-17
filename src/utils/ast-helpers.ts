import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';

/**
 * Shared AST utility functions used across scanners, analyzers, and fixers.
 * Consolidates duplicate code and provides consistent behavior.
 */
export class ASTHelpers {
  /**
   * Nesting statements that increase code complexity
   */
  static readonly NESTING_STATEMENTS = [
    'IfStatement',
    'ForStatement',
    'WhileStatement',
    'DoWhileStatement',
    'SwitchStatement'
  ];

  /**
   * Extract function name from AST node and path context.
   * Handles various function declaration patterns.
   *
   * @param node - Function AST node
   * @param path - Babel traverse path (optional)
   * @returns Function name or '<anonymous>' if not found
   */
  static getFunctionName(node: any, path?: any): string {
    // Named function declaration
    if (node.id?.name) {
      return node.id.name;
    }

    // Variable declarator: const foo = function() {}
    if (path?.parent) {
      if (t.isVariableDeclarator(path.parent) && t.isIdentifier(path.parent.id)) {
        return path.parent.id.name;
      }

      // Object property: { foo: function() {} }
      if (t.isObjectProperty(path.parent) && t.isIdentifier(path.parent.key)) {
        return path.parent.key.name;
      }

      // Class method: class Foo { bar() {} }
      if (t.isClassMethod(path.parent) && t.isIdentifier(path.parent.key)) {
        return path.parent.key.name;
      }

      // Assignment: foo = function() {}
      if (t.isAssignmentExpression(path.parent)) {
        const left = path.parent.left;
        if (t.isIdentifier(left)) {
          return left.name;
        }
        if (t.isMemberExpression(left) && t.isIdentifier(left.property)) {
          return left.property.name;
        }
      }

      // Fallback to parent id/key
      if (path.parent?.id?.name) return path.parent.id.name;
      if (path.parent?.key?.name) return path.parent.key.name;
    }

    return '<anonymous>';
  }

  /**
   * Calculate cyclomatic complexity of an AST node.
   * Cyclomatic complexity measures the number of linearly independent paths.
   *
   * @param ast - AST node to analyze
   * @returns Complexity score (minimum 1)
   */
  static calculateCyclomaticComplexity(ast: any): number {
    let complexity = 1;

    // Recursively walk the AST to count decision points
    const walk = (node: any) => {
      if (!node || typeof node !== 'object') return;

      // Count complexity for decision points
      switch (node.type) {
        case 'IfStatement':
        case 'ConditionalExpression':
        case 'ForStatement':
        case 'WhileStatement':
        case 'DoWhileStatement':
        case 'CatchClause':
          complexity++;
          break;
        case 'SwitchCase':
          if (node.test) complexity++; // Only count non-default cases
          break;
        case 'LogicalExpression':
          if (node.operator === '&&' || node.operator === '||') {
            complexity++;
          }
          break;
      }

      // Recursively walk all properties
      for (const key in node) {
        if (key === 'loc' || key === 'range' || key === 'comments') continue;
        const value = node[key];
        if (Array.isArray(value)) {
          value.forEach(item => walk(item));
        } else if (value && typeof value === 'object') {
          walk(value);
        }
      }
    };

    walk(ast);
    return complexity;
  }

  /**
   * Check if a node type increases nesting depth.
   *
   * @param type - AST node type
   * @returns True if the node type increases nesting
   */
  static isNestingStatement(type: string): boolean {
    return this.NESTING_STATEMENTS.includes(type);
  }

  /**
   * Measure maximum nesting depth within an AST path.
   * Deep nesting indicates code that may be hard to understand.
   *
   * @param path - Babel traverse path
   * @returns Maximum nesting depth found
   */
  static measureNestingDepth(path: any): number {
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

  /**
   * Calculate lines of code for an AST node.
   *
   * @param node - AST node with location information
   * @returns Number of lines of code (0 if no location info)
   */
  static calculateLOC(node: any): number {
    if (!node.loc) return 0;
    return node.loc.end.line - node.loc.start.line + 1;
  }

  /**
   * Check if a function path has error handling (try-catch).
   *
   * @param path - Function path to check
   * @returns True if function contains try-catch block
   */
  static hasErrorHandling(path: any): boolean {
    let hasTryCatch = false;

    path.traverse({
      TryStatement: () => {
        hasTryCatch = true;
      }
    });

    return hasTryCatch;
  }

  /**
   * Check if a node type adds cognitive load.
   * Cognitive complexity considers nesting and control flow changes.
   *
   * @param type - AST node type
   * @returns True if the node adds cognitive complexity
   */
  static addsCognitiveLoad(type: string): boolean {
    return [
      'IfStatement',
      'ConditionalExpression',
      'ForStatement',
      'WhileStatement',
      'SwitchCase',
      'CatchClause'
    ].includes(type);
  }

  /**
   * Calculate cognitive complexity of an AST node.
   * Cognitive complexity considers nesting depth and control flow.
   *
   * @param ast - AST node to analyze
   * @returns Cognitive complexity score
   */
  static calculateCognitiveComplexity(ast: any): number {
    let cognitive = 0;

    // Recursively walk the AST tracking nesting level
    const walk = (node: any, nestingLevel: number) => {
      if (!node || typeof node !== 'object') return;

      let currentNesting = nestingLevel;

      // Increase nesting for nesting statements
      if (this.isNestingStatement(node.type)) {
        currentNesting++;
      }

      // Add cognitive load based on nesting
      if (this.addsCognitiveLoad(node.type)) {
        cognitive += currentNesting > 0 ? currentNesting : 1;
      }

      // Recursively walk all properties with updated nesting
      for (const key in node) {
        if (key === 'loc' || key === 'range' || key === 'comments') continue;
        const value = node[key];
        if (Array.isArray(value)) {
          value.forEach(item => walk(item, currentNesting));
        } else if (value && typeof value === 'object') {
          walk(value, currentNesting);
        }
      }
    };

    walk(ast, 0);
    return cognitive;
  }
}
