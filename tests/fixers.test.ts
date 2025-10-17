import { SecretFixer } from '../src/fixers/secret-fixer';
import { MagicNumberFixer } from '../src/fixers/magic-number-fixer';
import { ErrorHandlerFixer } from '../src/fixers/error-handler-fixer';
import { CleanupFixer } from '../src/fixers/cleanup-fixer';
import { FixerOrchestrator } from '../src/fixers';
import { Issue, IssueSeverity, IssueCategory, ScanResult } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('SecretFixer', () => {
  let fixer: SecretFixer;
  let tempDir: string;

  beforeEach(() => {
    fixer = new SecretFixer();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vibescan-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should identify fixable issues', () => {
    const issue: Issue = {
      category: IssueCategory.SECURITY,
      severity: IssueSeverity.CRITICAL,
      message: 'Hardcoded API key detected',
      file: 'test.ts',
      line: 1
    };

    expect(fixer.canFix(issue)).toBe(true);
  });

  it('should fix hardcoded API keys', async () => {
    const sourceCode = `
const API_KEY = "sk-1234567890abcdef1234567890abcdef";
const result = fetch('api.com', { headers: { 'X-API-Key': API_KEY } });
`;

    const issue: Issue = {
      category: IssueCategory.SECURITY,
      severity: IssueSeverity.CRITICAL,
      message: 'Hardcoded API key detected',
      file: path.join(tempDir, 'test.ts'),
      line: 2
    };

    const result = await fixer.fix(issue.file, issue, sourceCode);

    // Debug: log the result if it fails
    if (!result.success) {
      console.log('Fix failed:', result.error);
    }

    expect(result.success).toBe(true);
    expect(result.fixedCode).toContain('process.env.API_KEY');
    expect(result.fixedCode).not.toContain('sk-1234567890abcdef');
    expect(result.changes.length).toBeGreaterThan(0);
  });

  it('should fix hardcoded secrets', async () => {
    const sourceCode = `
const SECRET_TOKEN = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";
authenticate(SECRET_TOKEN);
`;

    const issue: Issue = {
      category: IssueCategory.SECURITY,
      severity: IssueSeverity.CRITICAL,
      message: 'Hardcoded secret detected',
      file: path.join(tempDir, 'test.ts'),
      line: 2
    };

    const result = await fixer.fix(issue.file, issue, sourceCode);

    expect(result.success).toBe(true);
    expect(result.fixedCode).toContain('process.env.SECRET_TOKEN');
    expect(result.changes.some(c => c.includes('Moved') && c.includes('to environment variable'))).toBe(true);
  });

  it('should not fix obvious test values', async () => {
    const sourceCode = `
const API_KEY = "test-api-key-123";
const SECRET = "example-secret";
`;

    const issue: Issue = {
      category: IssueCategory.SECURITY,
      severity: IssueSeverity.CRITICAL,
      message: 'Hardcoded API key detected',
      file: path.join(tempDir, 'test.ts'),
      line: 2
    };

    const result = await fixer.fix(issue.file, issue, sourceCode);

    // Should fail because these look like test values
    expect(result.success).toBe(false);
  });
});

describe('MagicNumberFixer', () => {
  let fixer: MagicNumberFixer;

  beforeEach(() => {
    fixer = new MagicNumberFixer();
  });

  it('should identify fixable issues', () => {
    const issue: Issue = {
      category: IssueCategory.CODE_QUALITY,
      severity: IssueSeverity.MEDIUM,
      message: 'Magic number detected: 42',
      file: 'test.ts',
      line: 1
    };

    expect(fixer.canFix(issue)).toBe(true);
  });

  it('should extract magic numbers to constants', async () => {
    const sourceCode = `
function validateAge(age: number) {
  if (age > 18) {
    return true;
  }
  return false;
}
`;

    const issue: Issue = {
      category: IssueCategory.CODE_QUALITY,
      severity: IssueSeverity.MEDIUM,
      message: 'Magic number detected',
      file: 'test.ts',
      line: 3
    };

    const result = await fixer.fix(issue.file, issue, sourceCode);

    expect(result.success).toBe(true);
    expect(result.fixedCode).toContain('const MIN_AGE = 18');
    expect(result.fixedCode).toContain('age > MIN_AGE');
    expect(result.changes.some(c => c.includes('Extracted magic number 18'))).toBe(true);
  });

  it('should handle multiple magic numbers', async () => {
    const sourceCode = `
function calculate(value: number) {
  if (value >= 100) {
    return value * 3.14159;
  }
  return value * 42;
}
`;

    const issue: Issue = {
      category: IssueCategory.CODE_QUALITY,
      severity: IssueSeverity.MEDIUM,
      message: 'Magic number detected',
      file: 'test.ts',
      line: 3
    };

    const result = await fixer.fix(issue.file, issue, sourceCode);

    expect(result.success).toBe(true);
    // Should extract magic numbers (100 is typically extracted, but may be filtered)
    expect(result.changes.length).toBeGreaterThanOrEqual(2);
    expect(result.fixedCode).toContain('3.14159');
    expect(result.fixedCode).toContain('42');
  });

  it('should not extract common values', async () => {
    const sourceCode = `
function process(arr: number[]) {
  return arr[0] + arr[1] - 1;
}
`;

    const issue: Issue = {
      category: IssueCategory.CODE_QUALITY,
      severity: IssueSeverity.MEDIUM,
      message: 'Magic number detected',
      file: 'test.ts',
      line: 3
    };

    const result = await fixer.fix(issue.file, issue, sourceCode);

    // Should not extract 0, 1, -1
    expect(result.success).toBe(false);
  });

  it('should not extract array indices', async () => {
    const sourceCode = `
const item = array[5];
`;

    const issue: Issue = {
      category: IssueCategory.CODE_QUALITY,
      severity: IssueSeverity.MEDIUM,
      message: 'Magic number detected',
      file: 'test.ts',
      line: 2
    };

    const result = await fixer.fix(issue.file, issue, sourceCode);

    // Should not extract array indices
    expect(result.success).toBe(false);
  });
});

describe('ErrorHandlerFixer', () => {
  let fixer: ErrorHandlerFixer;

  beforeEach(() => {
    fixer = new ErrorHandlerFixer();
  });

  it('should identify fixable issues', () => {
    const issue: Issue = {
      category: IssueCategory.CODE_QUALITY,
      severity: IssueSeverity.MEDIUM,
      message: 'Async function without error handling',
      file: 'test.ts',
      line: 1
    };

    expect(fixer.canFix(issue)).toBe(true);
  });

  it('should add try-catch to async functions', async () => {
    const sourceCode = `
async function fetchData() {
  const response = await fetch('/api');
  return response.json();
}
`;

    const issue: Issue = {
      category: IssueCategory.CODE_QUALITY,
      severity: IssueSeverity.MEDIUM,
      message: 'Async function without error handling',
      file: 'test.ts',
      line: 2
    };

    const result = await fixer.fix(issue.file, issue, sourceCode);

    expect(result.success).toBe(true);
    expect(result.fixedCode).toContain('try {');
    expect(result.fixedCode).toContain('catch (error)');
    expect(result.fixedCode).toContain('console.error');
    expect(result.fixedCode).toContain('throw error');
  });

  it('should handle arrow async functions', async () => {
    const sourceCode = `
const getData = async () => {
  const result = await api.get('/data');
  return result;
};
`;

    const issue: Issue = {
      category: IssueCategory.CODE_QUALITY,
      severity: IssueSeverity.MEDIUM,
      message: 'Async function without error handling',
      file: 'test.ts',
      line: 2
    };

    const result = await fixer.fix(issue.file, issue, sourceCode);

    expect(result.success).toBe(true);
    expect(result.fixedCode).toContain('try {');
    expect(result.fixedCode).toContain('catch (error)');
  });

  it('should not modify functions that already have try-catch', async () => {
    const sourceCode = `
async function fetchData() {
  try {
    const response = await fetch('/api');
    return response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
`;

    const issue: Issue = {
      category: IssueCategory.CODE_QUALITY,
      severity: IssueSeverity.MEDIUM,
      message: 'Async function without error handling',
      file: 'test.ts',
      line: 2
    };

    const result = await fixer.fix(issue.file, issue, sourceCode);

    // Should not modify - already has error handling
    expect(result.success).toBe(false);
  });

  it('should include function name in error message', async () => {
    const sourceCode = `
async function fetchUserData() {
  const response = await fetch('/users');
  return response.json();
}
`;

    const issue: Issue = {
      category: IssueCategory.CODE_QUALITY,
      severity: IssueSeverity.MEDIUM,
      message: 'Async function without error handling',
      file: 'test.ts',
      line: 2
    };

    const result = await fixer.fix(issue.file, issue, sourceCode);

    expect(result.success).toBe(true);
    expect(result.fixedCode).toContain('Error in fetchUserData:');
  });
});

describe('CleanupFixer', () => {
  let fixer: CleanupFixer;

  beforeEach(() => {
    fixer = new CleanupFixer();
  });

  it('should identify fixable issues', () => {
    const issue: Issue = {
      category: IssueCategory.CODE_QUALITY,
      severity: IssueSeverity.LOW,
      message: 'TODO comment found',
      file: 'test.ts',
      line: 1
    };

    expect(fixer.canFix(issue)).toBe(true);
  });

  it('should remove TODO comments', async () => {
    const sourceCode = `
// TODO: Fix this later
function calculate(x: number) {
  return x * 2;
}
`;

    const issue: Issue = {
      category: IssueCategory.CODE_QUALITY,
      severity: IssueSeverity.LOW,
      message: 'TODO comment found',
      file: 'test.ts',
      line: 2
    };

    const result = await fixer.fix(issue.file, issue, sourceCode);

    expect(result.success).toBe(true);
    expect(result.fixedCode).not.toContain('TODO');
    expect(result.changes.some(c => c.includes('Removed TODO'))).toBe(true);
  });

  it('should remove FIXME comments', async () => {
    const sourceCode = `
function process() {
  // FIXME: This is broken
  return null;
}
`;

    const issue: Issue = {
      category: IssueCategory.CODE_QUALITY,
      severity: IssueSeverity.LOW,
      message: 'FIXME comment found',
      file: 'test.ts',
      line: 3
    };

    const result = await fixer.fix(issue.file, issue, sourceCode);

    expect(result.success).toBe(true);
    expect(result.fixedCode).not.toContain('FIXME');
  });

  it('should remove commented out code blocks', async () => {
    const sourceCode = `
function calculate() {
  // const old = 42;
  // return old * 2;
  return 100;
}
`;

    const issue: Issue = {
      category: IssueCategory.CODE_QUALITY,
      severity: IssueSeverity.LOW,
      message: 'Commented out code detected',
      file: 'test.ts',
      line: 3
    };

    const result = await fixer.fix(issue.file, issue, sourceCode);

    expect(result.success).toBe(true);
    expect(result.fixedCode).not.toContain('const old');
    expect(result.changes.some(c => c.includes('Removed commented out code'))).toBe(true);
  });

  it('should preserve normal comments', async () => {
    const sourceCode = `
// This is a normal comment explaining the function
function calculate(x: number) {
  // Calculate the double value
  return x * 2;
}
`;

    const issue: Issue = {
      category: IssueCategory.CODE_QUALITY,
      severity: IssueSeverity.LOW,
      message: 'Cleanup needed',
      file: 'test.ts',
      line: 2
    };

    const result = await fixer.fix(issue.file, issue, sourceCode);

    // Should not remove normal explanatory comments
    expect(result.success).toBe(false);
  });
});

describe('FixerOrchestrator', () => {
  let orchestrator: FixerOrchestrator;
  let tempDir: string;

  beforeEach(() => {
    orchestrator = new FixerOrchestrator();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vibescan-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should identify fixable issues', () => {
    const scanResult: ScanResult = {
      filesScanned: 1,
      totalIssues: 2,
      securityScore: 5,
      qualityScore: 7,
      aiPatternScore: 9,
      issues: [
        {
          category: IssueCategory.SECURITY,
          severity: IssueSeverity.CRITICAL,
          message: 'Hardcoded API key detected',
          file: 'test.ts',
          line: 1
        },
        {
          category: IssueCategory.CODE_QUALITY,
          severity: IssueSeverity.MEDIUM,
          message: 'Magic number detected: 42',
          file: 'test.ts',
          line: 5
        }
      ]
    };

    const fixable = orchestrator.getFixableIssues(scanResult);
    expect(fixable.length).toBe(2);
  });

  it('should get fixable stats', () => {
    const scanResult: ScanResult = {
      filesScanned: 1,
      totalIssues: 3,
      securityScore: 5,
      qualityScore: 7,
      aiPatternScore: 9,
      issues: [
        {
          category: IssueCategory.SECURITY,
          severity: IssueSeverity.CRITICAL,
          message: 'Hardcoded API key detected',
          file: 'test.ts',
          line: 1
        },
        {
          category: IssueCategory.CODE_QUALITY,
          severity: IssueSeverity.MEDIUM,
          message: 'Magic number detected: 42',
          file: 'test.ts',
          line: 5
        },
        {
          category: IssueCategory.CODE_QUALITY,
          severity: IssueSeverity.LOW,
          message: 'TODO comment found',
          file: 'test.ts',
          line: 10
        }
      ]
    };

    const stats = orchestrator.getFixableStats(scanResult);
    expect(stats.total).toBe(3);
    expect(stats.byFixer.size).toBeGreaterThan(0);
  });

  it('should fix multiple issues in a file', async () => {
    const testFile = path.join(tempDir, 'test.ts');
    const sourceCode = `
const API_KEY = "sk-1234567890abcdef1234567890abcdef";
// TODO: Remove this later
function calculate(x: number) {
  if (x > 42) {
    return x * 3.14;
  }
  return 0;
}
`;
    fs.writeFileSync(testFile, sourceCode);

    const scanResult: ScanResult = {
      filesScanned: 1,
      totalIssues: 3,
      securityScore: 5,
      qualityScore: 7,
      aiPatternScore: 9,
      issues: [
        {
          category: IssueCategory.SECURITY,
          severity: IssueSeverity.CRITICAL,
          message: 'Hardcoded API key detected',
          file: testFile,
          line: 2
        },
        {
          category: IssueCategory.CODE_QUALITY,
          severity: IssueSeverity.MEDIUM,
          message: 'Magic number detected: 42',
          file: testFile,
          line: 5
        },
        {
          category: IssueCategory.CODE_QUALITY,
          severity: IssueSeverity.LOW,
          message: 'TODO comment found',
          file: testFile,
          line: 3
        }
      ]
    };

    const report = await orchestrator.fixIssues(scanResult, {
      dryRun: false,
      createBackup: true
    });

    expect(report.filesModified).toBe(1);
    expect(report.totalFixed).toBeGreaterThan(0);
    expect(report.changes.length).toBeGreaterThan(0);
  });

  it('should create backups when fixing', async () => {
    const testFile = path.join(tempDir, 'test.ts');
    const sourceCode = `const API_KEY = "sk-1234567890abcdef1234567890abcdef";`;
    fs.writeFileSync(testFile, sourceCode);

    const scanResult: ScanResult = {
      filesScanned: 1,
      totalIssues: 1,
      securityScore: 5,
      qualityScore: 10,
      aiPatternScore: 10,
      issues: [
        {
          category: IssueCategory.SECURITY,
          severity: IssueSeverity.CRITICAL,
          message: 'Hardcoded API key detected',
          file: testFile,
          line: 1
        }
      ]
    };

    const report = await orchestrator.fixIssues(scanResult, {
      dryRun: false,
      createBackup: true
    });

    expect(report.backupDir).toBeTruthy();
    expect(fs.existsSync(report.backupDir)).toBe(true);
  });

  it('should not modify files in dry-run mode', async () => {
    const testFile = path.join(tempDir, 'test.ts');
    const sourceCode = `const API_KEY = "sk-1234567890abcdef1234567890abcdef";`;
    fs.writeFileSync(testFile, sourceCode);

    const scanResult: ScanResult = {
      filesScanned: 1,
      totalIssues: 1,
      securityScore: 5,
      qualityScore: 10,
      aiPatternScore: 10,
      issues: [
        {
          category: IssueCategory.SECURITY,
          severity: IssueSeverity.CRITICAL,
          message: 'Hardcoded API key detected',
          file: testFile,
          line: 1
        }
      ]
    };

    await orchestrator.fixIssues(scanResult, {
      dryRun: true,
      createBackup: false
    });

    const content = fs.readFileSync(testFile, 'utf-8');
    expect(content).toBe(sourceCode);
  });
});
