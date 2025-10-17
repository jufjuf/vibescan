import { AIPatternScanner } from '../src/scanner/ai-patterns';
import { ASTAnalyzer } from '../src/analyzers/ast-analyzer';

describe('AIPatternScanner', () => {
  let scanner: AIPatternScanner;
  let astAnalyzer: ASTAnalyzer;

  beforeEach(() => {
    scanner = new AIPatternScanner();
    astAnalyzer = new ASTAnalyzer();
  });

  test('detects long functions', () => {
    const longFunction = `
      function processData() {
        ${'\n'.repeat(60)}
      }
    `;

    const analysis = astAnalyzer.parseCode(longFunction);
    const issues = scanner.scanFile('test.js', analysis!);

    const longFuncIssues = issues.filter(i => i.message.includes('too long'));
    expect(longFuncIssues.length).toBeGreaterThan(0);
  });

  test('detects high complexity', () => {
    // Need more branches to trigger complexity > 10
    const complexCode = `
      function validate(data) {
        if (data.a) {
          if (data.b) {
            if (data.c) {
              if (data.d) {
                if (data.e) {
                  if (data.f) {
                    if (data.g) {
                      if (data.h) {
                        if (data.i) {
                          if (data.j) {
                            if (data.k) {
                              if (data.l) {
                                return true;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return false;
      }
    `;

    const analysis = astAnalyzer.parseCode(complexCode);
    const issues = scanner.scanFile('test.js', analysis!);

    const complexityIssues = issues.filter(i => i.message.includes('complexity'));
    expect(complexityIssues.length).toBeGreaterThan(0);
  });

  test('detects missing error handling in async functions', () => {
    const asyncCode = `
      async function fetchData() {
        const response = await fetch('/api/data');
        const data = await response.json();
        return data;
      }
    `;

    const analysis = astAnalyzer.parseCode(asyncCode);
    const issues = scanner.scanFile('test.js', analysis!);

    const errorHandlingIssues = issues.filter(i => i.message.includes('error handling'));
    expect(errorHandlingIssues.length).toBeGreaterThan(0);
  });

  test('detects magic numbers', () => {
    const magicNumberCode = `
      function calculate(value) {
        if (value > 42) {
          return value * 3.14159;
        }
        return value;
      }
    `;

    const analysis = astAnalyzer.parseCode(magicNumberCode);
    const issues = scanner.scanFile('test.js', analysis!);

    const magicNumberIssues = issues.filter(i => i.message.includes('Magic number'));
    expect(magicNumberIssues.length).toBeGreaterThan(0);
  });

  test('allows common numbers like 0, 1, 2', () => {
    const commonNumbers = `
      function process(arr) {
        if (arr.length === 0) return [];
        if (arr.length === 1) return arr;
        return arr.slice(0, 2);
      }
    `;

    const analysis = astAnalyzer.parseCode(commonNumbers);
    const issues = scanner.scanFile('test.js', analysis!);

    const magicNumberIssues = issues.filter(i => i.message.includes('Magic number'));
    expect(magicNumberIssues.length).toBe(0);
  });

  test('detects deep nesting', () => {
    const deeplyNestedCode = `
      function process(data) {
        if (data.valid) {
          for (let i = 0; i < data.items.length; i++) {
            if (data.items[i].active) {
              while (data.processing) {
                if (data.ready) {
                  // Deep nesting
                }
              }
            }
          }
        }
      }
    `;

    const analysis = astAnalyzer.parseCode(deeplyNestedCode);
    const issues = scanner.scanFile('test.js', analysis!);

    const nestingIssues = issues.filter(i => i.message.includes('nesting'));
    expect(nestingIssues.length).toBeGreaterThan(0);
  });
});
