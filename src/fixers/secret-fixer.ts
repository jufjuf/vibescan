import { BaseFixer, FixResult } from './base-fixer';
import { Issue } from '../types';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import * as fs from 'fs';
import * as path from 'path';

export class SecretFixer extends BaseFixer {
  name = 'secret-fixer';

  canFix(issue: Issue): boolean {
    return issue.message.includes('Hardcoded API key') ||
           issue.message.includes('Hardcoded secret') ||
           issue.message.includes('Hardcoded password') ||
           issue.message.includes('Hardcoded token');
  }

  async fix(filePath: string, issue: Issue, sourceCode: string): Promise<FixResult> {
    try {
      const ast = parse(sourceCode, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx']
      });

      const changes: string[] = [];
      const envVars: Map<string, string> = new Map();

      traverse(ast, {
        VariableDeclarator: (path) => {
          if (path.node.init && t.isStringLiteral(path.node.init)) {
            const value = path.node.init.value;
            const varName = t.isIdentifier(path.node.id) ? path.node.id.name : null;

            // Detect hardcoded secrets
            if (this.looksLikeSecret(value, varName)) {
              const envVarName = this.generateEnvVarName(varName || 'SECRET');

              // Replace with process.env access
              path.node.init = t.logicalExpression(
                '||',
                t.memberExpression(
                  t.memberExpression(
                    t.identifier('process'),
                    t.identifier('env')
                  ),
                  t.identifier(envVarName)
                ),
                t.stringLiteral('')
              );

              envVars.set(envVarName, value);
              changes.push(`Moved ${varName || 'secret'} to environment variable ${envVarName}`);
            }
          }
        },
        AssignmentExpression: (path) => {
          if (t.isStringLiteral(path.node.right)) {
            const value = path.node.right.value;

            // Get variable name from left side
            let varName = 'SECRET';
            if (t.isMemberExpression(path.node.left) && t.isIdentifier(path.node.left.property)) {
              varName = path.node.left.property.name;
            } else if (t.isIdentifier(path.node.left)) {
              varName = path.node.left.name;
            }

            if (this.looksLikeSecret(value, varName)) {
              const envVarName = this.generateEnvVarName(varName);

              path.node.right = t.logicalExpression(
                '||',
                t.memberExpression(
                  t.memberExpression(
                    t.identifier('process'),
                    t.identifier('env')
                  ),
                  t.identifier(envVarName)
                ),
                t.stringLiteral('')
              );

              envVars.set(envVarName, value);
              changes.push(`Moved ${varName} to environment variable ${envVarName}`);
            }
          }
        }
      });

      if (changes.length === 0) {
        return this.createFailureResult(sourceCode, 'No secrets found to fix');
      }

      const output = generate(ast, {
        retainLines: true,
        compact: false
      });

      // Create .env.example file
      await this.updateEnvExample(filePath, envVars);
      changes.push(`Updated .env.example with ${envVars.size} variable(s)`);

      return this.createSuccessResult(sourceCode, output.code, changes);
    } catch (error) {
      return this.createFailureResult(
        sourceCode,
        `Failed to fix secrets: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private looksLikeSecret(value: string, varName: string | null): boolean {
    // Don't flag obvious test/example values first
    const isFakeSecret = /test|example|demo|sample|placeholder|xxx/i.test(value);
    if (isFakeSecret) {
      return false;
    }

    // Must be at least 10 characters
    if (value.length < 10) {
      return false;
    }

    // Check variable name patterns
    const secretPatterns = /api[_-]?key|secret|password|token|auth|credential|private[_-]?key/i;
    const nameMatch = varName && secretPatterns.test(varName);

    // Check value patterns (long alphanumeric strings, typical API key formats)
    const valuePatterns = [
      /^sk-[a-zA-Z0-9]{20,}$/, // OpenAI style
      /^[a-zA-Z0-9]{32,}$/, // Generic long token
      /^[a-f0-9]{40,}$/, // Hex tokens (GitHub, etc)
      /^ghp_[a-zA-Z0-9]{20,}$/, // GitHub personal access token
      /^ya29\.[a-zA-Z0-9_-]{100,}$/, // Google OAuth
      /^xox[a-z]-[a-zA-Z0-9-]{10,}$/ // Slack tokens
    ];
    const valueMatch = valuePatterns.some(pattern => pattern.test(value));

    // Return true if name matches AND value is long enough, OR value matches a pattern
    return (nameMatch && value.length >= 20) || valueMatch;
  }

  private generateEnvVarName(varName: string): string {
    // If already in UPPER_SNAKE_CASE or UPPER_CASE, return as is
    if (varName === varName.toUpperCase() && varName.includes('_')) {
      return varName;
    }

    // If already all uppercase without underscores, return as is
    if (varName === varName.toUpperCase()) {
      return varName;
    }

    // Convert camelCase or PascalCase to UPPER_SNAKE_CASE
    return varName
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, '')
      .replace(/_+/g, '_');
  }

  private async updateEnvExample(filePath: string, envVars: Map<string, string>): Promise<void> {
    // Find project root (where package.json or .git exists)
    const projectRoot = this.findProjectRoot(filePath);
    const envExamplePath = path.join(projectRoot, '.env.example');

    let existingContent = '';
    if (fs.existsSync(envExamplePath)) {
      existingContent = fs.readFileSync(envExamplePath, 'utf-8');
    }

    const lines = existingContent.split('\n').filter(line => line.trim());
    const existingVars = new Set(
      lines.map(line => line.split('=')[0].trim()).filter(Boolean)
    );

    // Add new variables
    const newLines: string[] = [];
    for (const [envVar, originalValue] of envVars) {
      if (!existingVars.has(envVar)) {
        // Add placeholder comment with hint about original value
        newLines.push(`# ${envVar} - Replace with your actual value`);
        newLines.push(`${envVar}=your_${envVar.toLowerCase()}_here`);
        newLines.push('');
      }
    }

    if (newLines.length > 0) {
      const content = existingContent
        ? existingContent + '\n' + newLines.join('\n')
        : newLines.join('\n');
      fs.writeFileSync(envExamplePath, content);
    }
  }

  private findProjectRoot(startPath: string): string {
    let currentPath = path.dirname(startPath);

    while (currentPath !== path.dirname(currentPath)) {
      if (
        fs.existsSync(path.join(currentPath, 'package.json')) ||
        fs.existsSync(path.join(currentPath, '.git'))
      ) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
    }

    return path.dirname(startPath);
  }
}
