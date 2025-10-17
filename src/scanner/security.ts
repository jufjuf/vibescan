import * as fs from 'fs';
import traverse from '@babel/traverse';
import { Issue, IssueSeverity, IssueCategory } from '../types';

export class SecurityScanner {
  scanFile(filePath: string, ast: any): Issue[] {
    const issues: Issue[] = [];
    const code = fs.readFileSync(filePath, 'utf-8');

    issues.push(...this.detectHardcodedSecrets(filePath, code));
    issues.push(...this.detectSQLInjection(filePath, ast));
    issues.push(...this.detectDangerousFunctions(filePath, ast));
    issues.push(...this.detectInsecureRegex(filePath, code));
    issues.push(...this.detectMissingValidation(filePath, ast));

    return issues;
  }

  private detectHardcodedSecrets(file: string, code: string): Issue[] {
    const issues: Issue[] = [];
    const lines = code.split('\n');

    const patterns = [
      { regex: /api[_-]?key\s*[:=]\s*["'][^"']{20,}["']/i, msg: 'Hardcoded API key' },
      { regex: /password\s*[:=]\s*["'][^"']+["']/i, msg: 'Hardcoded password' },
      { regex: /secret\s*[:=]\s*["'][^"']{20,}["']/i, msg: 'Hardcoded secret' },
      { regex: /token\s*[:=]\s*["'][^"']{20,}["']/i, msg: 'Hardcoded token' },
      { regex: /sk-[a-zA-Z0-9]{20,}/i, msg: 'OpenAI API key exposed' },
      { regex: /ghp_[a-zA-Z0-9]{36}/i, msg: 'GitHub personal access token' },
      { regex: /AKIA[0-9A-Z]{16}/i, msg: 'AWS access key' }
    ];

    lines.forEach((line, idx) => {
      patterns.forEach(({ regex, msg }) => {
        if (regex.test(line)) {
          issues.push({
            category: IssueCategory.SECURITY,
            severity: IssueSeverity.CRITICAL,
            message: msg + ' found',
            file,
            line: idx + 1,
            suggestion: 'Move secrets to environment variables',
            code: line.trim()
          });
        }
      });
    });

    return issues;
  }

  private detectSQLInjection(file: string, ast: any): Issue[] {
    const issues: Issue[] = [];

    traverse(ast, {
      TemplateLiteral: (path) => {
        const parent = path.parent;
        if (this.isSQLQuery(path.node)) {
          issues.push({
            category: IssueCategory.SECURITY,
            severity: IssueSeverity.MEDIUM,
            message: 'SQL injection risk - using template literals for queries',
            file,
            line: path.node.loc?.start.line || 0,
            suggestion: 'Use parameterized queries or ORM'
          });
        }
      },
      BinaryExpression: (path) => {
        if (path.node.operator === '+' && this.containsSQLKeyword(path)) {
          issues.push({
            category: IssueCategory.SECURITY,
            severity: IssueSeverity.MEDIUM,
            message: 'SQL injection risk - string concatenation in query',
            file,
            line: path.node.loc?.start.line || 0,
            suggestion: 'Use parameterized queries'
          });
        }
      }
    });

    return issues;
  }

  private detectDangerousFunctions(file: string, ast: any): Issue[] {
    const issues: Issue[] = [];

    traverse(ast, {
      CallExpression: (path) => {
        const callee = path.node.callee;

        if (callee.type === 'Identifier' && callee.name === 'eval') {
          issues.push({
            category: IssueCategory.SECURITY,
            severity: IssueSeverity.CRITICAL,
            message: 'Use of eval() detected - major security risk',
            file,
            line: path.node.loc?.start.line || 0,
            suggestion: 'Avoid eval(), use safer alternatives'
          });
        }

        if (callee.type === 'Identifier' && callee.name === 'Function') {
          issues.push({
            category: IssueCategory.SECURITY,
            severity: IssueSeverity.HIGH,
            message: 'Use of Function() constructor detected',
            file,
            line: path.node.loc?.start.line || 0,
            suggestion: 'Avoid Function constructor, use regular functions'
          });
        }

        if (callee.type === 'MemberExpression' &&
            callee.property.type === 'Identifier' &&
            callee.property.name === 'innerHTML') {
          issues.push({
            category: IssueCategory.SECURITY,
            severity: IssueSeverity.MEDIUM,
            message: 'Potential XSS - using innerHTML',
            file,
            line: path.node.loc?.start.line || 0,
            suggestion: 'Use textContent or sanitize HTML input'
          });
        }
      },
      AssignmentExpression: (path) => {
        const left = path.node.left;
        if (left.type === 'MemberExpression' &&
            left.property.type === 'Identifier' &&
            left.property.name === 'innerHTML') {
          issues.push({
            category: IssueCategory.SECURITY,
            severity: IssueSeverity.MEDIUM,
            message: 'Potential XSS - using innerHTML',
            file,
            line: path.node.loc?.start.line || 0,
            suggestion: 'Use textContent or sanitize HTML input'
          });
        }
      }
    });

    return issues;
  }

  private detectInsecureRegex(file: string, code: string): Issue[] {
    const issues: Issue[] = [];
    const lines = code.split('\n');

    // ReDoS patterns: nested quantifiers
    const redosPattern = /\/.*(\*\+|\+\*|\+\+|\*\*).*\//;

    lines.forEach((line, idx) => {
      if (redosPattern.test(line)) {
        issues.push({
          category: IssueCategory.SECURITY,
          severity: IssueSeverity.MEDIUM,
          message: 'Potential ReDoS vulnerability - nested quantifiers',
          file,
          line: idx + 1,
          suggestion: 'Review regex for catastrophic backtracking',
          code: line.trim()
        });
      }
    });

    return issues;
  }

  private detectMissingValidation(file: string, ast: any): Issue[] {
    const issues: Issue[] = [];

    traverse(ast, {
      MemberExpression: (path) => {
        const obj = path.node.object;
        const prop = path.node.property;

        // Check for req.body, req.params, req.query without validation
        if (obj.type === 'Identifier' && obj.name === 'req' &&
            prop.type === 'Identifier' &&
            ['body', 'params', 'query'].includes(prop.name)) {

          const parent = path.parentPath;
          if (!this.hasValidationNearby(parent)) {
            issues.push({
              category: IssueCategory.SECURITY,
              severity: IssueSeverity.MEDIUM,
              message: 'User input used without validation',
              file,
              line: path.node.loc?.start.line || 0,
              suggestion: 'Validate and sanitize user input'
            });
          }
        }
      }
    });

    return issues;
  }

  private isSQLQuery(node: any): boolean {
    if (!node.quasis) return false;
    const query = node.quasis.map((q: any) => q.value.raw).join('').toUpperCase();
    return /SELECT|INSERT|UPDATE|DELETE|DROP|CREATE/.test(query);
  }

  private containsSQLKeyword(path: any): boolean {
    let hasSQLKeyword = false;

    path.traverse({
      StringLiteral: (innerPath: any) => {
        const value = innerPath.node.value.toUpperCase();
        if (/SELECT|INSERT|UPDATE|DELETE|WHERE|FROM/.test(value)) {
          hasSQLKeyword = true;
        }
      }
    });

    return hasSQLKeyword;
  }

  private hasValidationNearby(path: any): boolean {
    // Simple heuristic: check if there's a validation library call nearby
    let hasValidation = false;

    const functionParent = path.getFunctionParent();
    if (functionParent) {
      functionParent.traverse({
        CallExpression: (innerPath: any) => {
          const callee = innerPath.node.callee;
          if (callee.name && /validate|sanitize|check/.test(callee.name)) {
            hasValidation = true;
          }
        }
      });
    }

    return hasValidation;
  }
}
