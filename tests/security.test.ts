import { SecurityScanner } from '../src/scanner/security';
import { ASTAnalyzer } from '../src/analyzers/ast-analyzer';
import * as fs from 'fs';
import * as path from 'path';

describe('SecurityScanner', () => {
  let scanner: SecurityScanner;
  let astAnalyzer: ASTAnalyzer;
  let tempDir: string;

  beforeEach(() => {
    scanner = new SecurityScanner();
    astAnalyzer = new ASTAnalyzer();
    tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  test('detects hardcoded API keys', () => {
    const code = `
      const API_KEY = "sk-1234567890abcdefghijklmnop";
      const token = "ghp_abcdefghijklmnopqrstuvwxyz123456";
    `;

    const tempFile = path.join(tempDir, 'test.js');
    fs.writeFileSync(tempFile, code);

    const ast = astAnalyzer.parseCode(code);
    const issues = scanner.scanFile(tempFile, ast!.rawAST);

    const apiKeyIssues = issues.filter(i => i.message.includes('API key'));
    expect(apiKeyIssues.length).toBeGreaterThan(0);
  });

  test('detects SQL injection risks', () => {
    const code = `
      const query = "SELECT * FROM users WHERE id=" + userId;
      db.query(query);
    `;

    const tempFile = path.join(tempDir, 'sql.js');
    fs.writeFileSync(tempFile, code);

    const ast = astAnalyzer.parseCode(code);
    const issues = scanner.scanFile(tempFile, ast!.rawAST);

    const sqlIssues = issues.filter(i => i.message.includes('SQL injection'));
    expect(sqlIssues.length).toBeGreaterThan(0);
  });

  test('detects eval usage', () => {
    const code = `
      const result = eval(userInput);
    `;

    const tempFile = path.join(tempDir, 'eval.js');
    fs.writeFileSync(tempFile, code);

    const ast = astAnalyzer.parseCode(code);
    const issues = scanner.scanFile(tempFile, ast!.rawAST);

    const evalIssues = issues.filter(i => i.message.includes('eval'));
    expect(evalIssues.length).toBeGreaterThan(0);
    expect(evalIssues[0].severity).toBe('CRITICAL');
  });

  test('detects innerHTML usage', () => {
    const code = `
      element.innerHTML = userInput;
    `;

    const tempFile = path.join(tempDir, 'xss.js');
    fs.writeFileSync(tempFile, code);

    const ast = astAnalyzer.parseCode(code);
    const issues = scanner.scanFile(tempFile, ast!.rawAST);

    const xssIssues = issues.filter(i => i.message.includes('XSS'));
    expect(xssIssues.length).toBeGreaterThan(0);
  });

  test('does not flag secure code', () => {
    const code = `
      const config = {
        apiUrl: process.env.API_URL
      };
    `;

    const tempFile = path.join(tempDir, 'secure.js');
    fs.writeFileSync(tempFile, code);

    const ast = astAnalyzer.parseCode(code);
    const issues = scanner.scanFile(tempFile, ast!.rawAST);

    // Should have no critical security issues
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
    expect(criticalIssues.length).toBe(0);
  });
});
