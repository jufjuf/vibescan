# VibeScan Quick Start

## Installation

```bash
cd ~/projects/vibescan
npm install
npm run build
```

## Run Your First Scan

### Scan the demo directory

```bash
node dist/cli.js scan demo
```

This will scan the demo files and show you security vulnerabilities, AI-generated code patterns, and quality issues.

### Scan your own code

```bash
node dist/cli.js scan /path/to/your/project
```

### Export to JSON

```bash
node dist/cli.js scan demo --json > report.json
```

### Create configuration file

```bash
node dist/cli.js init
```

This creates `.vibescan.json` with default settings.

## What VibeScan Detects

### Security Issues (6 types)
- ✅ Hardcoded secrets (API keys, passwords, tokens)
- ✅ SQL injection vulnerabilities
- ✅ XSS vulnerabilities (innerHTML)
- ✅ Dangerous functions (eval, Function constructor)
- ✅ ReDoS vulnerabilities
- ✅ Missing input validation

### AI-Specific Patterns (6 types)
- ✅ Long functions (> 50 lines)
- ✅ High cyclomatic complexity (> 10)
- ✅ Missing error handling in async functions
- ✅ Magic numbers without constants
- ✅ Deep nesting (> 3 levels)
- ✅ Inconsistent naming conventions

### Code Quality (4 types)
- ✅ TODO/FIXME comments
- ✅ High complexity
- ✅ Too many parameters (> 5)
- ✅ Duplicate code

## Example Output

The demo scan will find 19 issues including:
- 6 critical security vulnerabilities
- 10 AI-specific code patterns
- 3 code quality issues

## Using as a Library

See `example-usage.js` for programmatic usage.

## Running Tests

```bash
npm test
```

All 11 tests should pass.

## Next Steps

1. Scan your own codebase
2. Fix critical security issues first
3. Address AI patterns and quality issues
4. Integrate into your CI/CD pipeline
5. Create custom rules in `.vibescan.json`

## Success!

You now have a working AI code scanner that can detect:
- Security vulnerabilities that slip through AI code generation
- AI-specific anti-patterns (long functions, high complexity)
- Code quality issues

Happy scanning! 🔍
