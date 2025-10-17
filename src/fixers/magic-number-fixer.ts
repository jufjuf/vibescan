import { BaseFixer, FixResult } from './base-fixer';
import { Issue, IssueType } from '../types';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

export class MagicNumberFixer extends BaseFixer {
  name = 'magic-number-fixer';

  canFix(issue: Issue): boolean {
    // Use type-safe matching instead of string matching
    if (issue.type) {
      return issue.type === IssueType.MAGIC_NUMBER;
    }

    // Fallback to message matching for backward compatibility during migration
    return issue.message.includes('Magic number') ||
           issue.message.includes('magic number');
  }

  async fix(filePath: string, issue: Issue, sourceCode: string): Promise<FixResult> {
    try {
      const ast = parse(sourceCode, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx']
      });

      const changes: string[] = [];
      const magicNumbers: Map<number, string> = new Map();
      const numbersToReplace: Array<{ path: any; value: number }> = [];

      // First pass: collect magic numbers
      traverse(ast, {
        NumericLiteral: (path) => {
          const value = path.node.value;

          // Skip common values and special cases
          if (this.shouldIgnoreNumber(value, path)) {
            return;
          }

          // Generate constant name based on context
          const constantName = this.generateConstantName(value, path);
          magicNumbers.set(value, constantName);
          numbersToReplace.push({ path, value });
        }
      });

      if (magicNumbers.size === 0) {
        return this.createFailureResult(sourceCode, 'No magic numbers found to fix');
      }

      // Second pass: replace magic numbers with identifiers
      for (const { path, value } of numbersToReplace) {
        const constantName = magicNumbers.get(value);
        if (constantName) {
          path.replaceWith(t.identifier(constantName));
        }
      }

      // Add constant declarations at the top of the file
      const constantDeclarations = this.createConstantDeclarations(magicNumbers);

      // Find the best place to insert constants (after imports)
      let insertIndex = 0;
      if (ast.program.body.length > 0) {
        for (let i = 0; i < ast.program.body.length; i++) {
          const node = ast.program.body[i];
          if (
            t.isImportDeclaration(node) ||
            t.isExpressionStatement(node)
          ) {
            insertIndex = i + 1;
          } else {
            break;
          }
        }
      }

      ast.program.body.splice(insertIndex, 0, ...constantDeclarations);

      for (const [value, name] of magicNumbers) {
        changes.push(`Extracted magic number ${value} to constant ${name}`);
      }

      const output = generate(ast, {
        retainLines: false,
        compact: false
      });

      return this.createSuccessResult(sourceCode, output.code, changes);
    } catch (error) {
      return this.createFailureResult(
        sourceCode,
        `Failed to fix magic numbers: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private shouldIgnoreNumber(value: number, path: any): boolean {
    // Ignore common values
    const ignoredValues = new Set([0, 1, 2, -1, 10, 1000]);
    if (ignoredValues.has(value)) {
      return true;
    }

    // Ignore array indices
    if (path.parent && t.isMemberExpression(path.parent) && path.parent.property === path.node) {
      return true;
    }

    // Ignore in array/object literals that look like data structures
    if (path.parent && (t.isArrayExpression(path.parent) || t.isObjectProperty(path.parent))) {
      return true;
    }

    // Ignore very small numbers (< 3) in specific contexts
    if (Math.abs(value) < 3 && this.isIncrementOrLoopContext(path)) {
      return true;
    }

    // Ignore hex colors and similar
    if (Number.isInteger(value) && value.toString(16).length === 6) {
      return true;
    }

    return false;
  }

  private isIncrementOrLoopContext(path: any): boolean {
    const parent = path.parent;
    if (!parent) return false;

    // Check if in update expression (i++, i--, etc)
    if (t.isUpdateExpression(parent)) {
      return true;
    }

    // Check if in assignment with += or -=
    if (t.isAssignmentExpression(parent) &&
        (parent.operator === '+=' || parent.operator === '-=')) {
      return true;
    }

    return false;
  }

  private generateConstantName(value: number, path: any): string {
    // Try to infer meaning from context
    let baseName = '';

    // Check variable name in parent context
    if (path.parent) {
      if (t.isBinaryExpression(path.parent)) {
        const operator = path.parent.operator;
        const leftSide = path.parent.left;

        if (t.isIdentifier(leftSide)) {
          const varName = leftSide.name;

          if (operator === '>' || operator === '>=') {
            baseName = `MIN_${varName.toUpperCase()}`;
          } else if (operator === '<' || operator === '<=') {
            baseName = `MAX_${varName.toUpperCase()}`;
          } else {
            baseName = varName.toUpperCase();
          }
        }
      } else if (t.isVariableDeclarator(path.parent)) {
        const id = path.parent.id;
        if (t.isIdentifier(id)) {
          baseName = id.name.toUpperCase();
        }
      }
    }

    // Fallback: generate based on value characteristics
    if (!baseName) {
      if (Number.isInteger(value)) {
        if (value === 24) baseName = 'HOURS_IN_DAY';
        else if (value === 60) baseName = 'MINUTES_OR_SECONDS';
        else if (value === 7) baseName = 'DAYS_IN_WEEK';
        else if (value === 365) baseName = 'DAYS_IN_YEAR';
        else baseName = `CONSTANT_${Math.abs(value)}`;
      } else {
        if (value === 3.14159 || value === 3.14) baseName = 'PI';
        else if (value === 2.71828 || value === 2.72) baseName = 'E';
        else baseName = `CONSTANT_${value.toString().replace('.', '_').replace('-', 'NEG_')}`;
      }
    }

    return baseName;
  }

  private createConstantDeclarations(magicNumbers: Map<number, string>): any[] {
    const declarations: any[] = [];
    const seenNames = new Set<string>();

    for (const [value, name] of magicNumbers) {
      // Handle duplicate names
      let finalName = name;
      let counter = 1;
      while (seenNames.has(finalName)) {
        finalName = `${name}_${counter}`;
        counter++;
      }
      seenNames.add(finalName);

      const declaration = t.variableDeclaration('const', [
        t.variableDeclarator(
          t.identifier(finalName),
          t.numericLiteral(value)
        )
      ]);
      declarations.push(declaration);
    }

    return declarations;
  }
}
