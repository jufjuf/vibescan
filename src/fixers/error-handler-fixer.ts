import { BaseFixer, FixResult } from './base-fixer';
import { Issue, IssueType } from '../types';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

export class ErrorHandlerFixer extends BaseFixer {
  name = 'error-handler-fixer';

  canFix(issue: Issue): boolean {
    // Use type-safe matching instead of string matching
    if (issue.type) {
      return issue.type === IssueType.MISSING_ERROR_HANDLING;
    }

    // Fallback to message matching for backward compatibility during migration
    return issue.message.includes('Async function without error handling') ||
           issue.message.includes('async function') && issue.message.includes('try-catch');
  }

  async fix(filePath: string, issue: Issue, sourceCode: string): Promise<FixResult> {
    try {
      const ast = parse(sourceCode, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx']
      });

      const changes: string[] = [];

      traverse(ast, {
        Function: (path) => {
          // Only process async functions
          if (!path.node.async) {
            return;
          }

          // Wrap function body in try-catch
          const originalBody = path.node.body;

          if (!t.isBlockStatement(originalBody)) {
            return;
          }

          // Check if already has try-catch
          if (this.hasTryCatch(originalBody)) {
            return;
          }

          // Get function name for error message
          const functionName = this.getFunctionName(path.node, path);

          if (t.isBlockStatement(originalBody)) {
            const tryBlock = t.tryStatement(
              originalBody,
              t.catchClause(
                t.identifier('error'),
                t.blockStatement([
                  // console.error statement
                  t.expressionStatement(
                    t.callExpression(
                      t.memberExpression(
                        t.identifier('console'),
                        t.identifier('error')
                      ),
                      [
                        t.stringLiteral(`Error in ${functionName}:`),
                        t.identifier('error')
                      ]
                    )
                  ),
                  // Re-throw the error
                  t.throwStatement(t.identifier('error'))
                ])
              )
            );

            path.node.body = t.blockStatement([tryBlock]);
            changes.push(`Added error handling to async function ${functionName}`);
          }
        }
      });

      if (changes.length === 0) {
        return this.createFailureResult(
          sourceCode,
          'No async functions without error handling found'
        );
      }

      const output = generate(ast, {
        retainLines: false,
        compact: false
      });

      return this.createSuccessResult(sourceCode, output.code, changes);
    } catch (error) {
      return this.createFailureResult(
        sourceCode,
        `Failed to add error handling: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private hasTryCatch(body: t.BlockStatement): boolean {
    // Check if the function body already contains a try-catch
    return body.body.some(statement => t.isTryStatement(statement));
  }

  private getFunctionName(node: t.Function, path: any): string {
    // Function declaration
    if (t.isFunctionDeclaration(node) && node.id) {
      return node.id.name;
    }

    // Arrow function or function expression assigned to variable
    if (path.parent) {
      if (t.isVariableDeclarator(path.parent) && t.isIdentifier(path.parent.id)) {
        return path.parent.id.name;
      }

      // Object method
      if (t.isObjectProperty(path.parent) && t.isIdentifier(path.parent.key)) {
        return path.parent.key.name;
      }

      // Class method
      if (t.isClassMethod(path.parent) && t.isIdentifier(path.parent.key)) {
        return path.parent.key.name;
      }

      // Assignment expression
      if (t.isAssignmentExpression(path.parent)) {
        const left = path.parent.left;
        if (t.isIdentifier(left)) {
          return left.name;
        }
        if (t.isMemberExpression(left) && t.isIdentifier(left.property)) {
          return left.property.name;
        }
      }
    }

    return 'anonymous';
  }
}
