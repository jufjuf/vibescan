# VibeScan

**AI Code Security & Quality Auditor** - Detect vulnerabilities and anti-patterns in AI-generated code

VibeScan is a CLI tool that scans JavaScript/TypeScript code for security vulnerabilities, code quality issues, and AI-specific anti-patterns. Research shows that 45% of AI-generated code has security flaws - VibeScan helps you catch them before deployment.

## Features

### Security Checks
- Hardcoded secrets (API keys, passwords, tokens)
- SQL injection patterns
- XSS vulnerabilities (innerHTML usage)
- Dangerous functions (eval, Function constructor)
- ReDoS (Regular Expression Denial of Service)
- Missing input validation

### AI-Specific Pattern Detection
- Long functions (> 50 lines)
- High cyclomatic complexity (> 10)
- Missing error handling in async functions
- Magic numbers without constants
- Deep nesting (> 3 levels)
- Inconsistent naming conventions

### Code Quality Metrics
- Cyclomatic complexity
- Cognitive complexity
- Lines of code per function
- Too many parameters (> 5)
- TODO/FIXME comments
- Duplicate code detection

## Installation

```bash
npm install -g vibescan
```

Or use locally:

```bash
npm install vibescan --save-dev
```

## Usage

### Scan a directory

```bash
vibescan scan ./src
```

### Output as JSON

```bash
vibescan scan ./src --json
```

### Save report to file

```bash
vibescan scan ./src --json -o report.json
```

### Initialize configuration

```bash
vibescan init
```

This creates a `.vibescan.json` file with default settings:

```json
{
  "ignore": [
    "node_modules",
    "dist",
    "build",
    ".next",
    "coverage"
  ],
  "rules": {
    "maxFunctionLength": 50,
    "maxComplexity": 10,
    "maxParameters": 5,
    "maxNestingDepth": 3
  }
}
```

## Example Output

```
VibeScan Report
═══════════════════════════════════════

📁 Files scanned: 42
⚠️  Issues found: 15

🔒 Security Issues (5)
─────────────────────────────────────
🔴 CRITICAL: Hardcoded API key found
   └─ src/config.ts:12
   └─ Suggestion: Move secrets to environment variables
   └─ const API_KEY = "sk-1234..."

🟡 MEDIUM: SQL injection risk
   └─ src/db.ts:45
   └─ Suggestion: Use parameterized queries
   └─ query = "SELECT * FROM users WHERE id=" + userId

🤖 AI Code Patterns (7)
─────────────────────────────────────
🟡 MEDIUM: Function too long (78 lines)
   └─ src/utils.ts:12
   └─ Suggestion: Break processUserData into smaller functions

🟡 MEDIUM: Missing error handling
   └─ src/api.ts:23
   └─ Suggestion: Add try/catch to fetchData

📊 Code Quality (3)
─────────────────────────────────────
🔵 LOW: High complexity (complexity: 15)
   └─ src/validator.ts:45
   └─ Suggestion: Simplify validate

🔵 LOW: Magic number: 100
   └─ src/limits.ts:8
   └─ Suggestion: Extract to named constant

Summary
─────────────────────────────────────
✅ Security Score: 7.2/10
✅ Code Quality: 8.1/10
⚠️  AI Patterns: 5.5/10
```

## Development

### Build

```bash
npm run build
```

### Run in development mode

```bash
npm run dev scan ./src
```

### Run tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

## Architecture

```
vibescan/
├── src/
│   ├── cli.ts                 # CLI entry point
│   ├── scanner/
│   │   ├── index.ts           # Scanner orchestrator
│   │   ├── security.ts        # Security vulnerability detection
│   │   ├── quality.ts         # Code quality analysis
│   │   └── ai-patterns.ts     # AI-specific pattern detection
│   ├── analyzers/
│   │   ├── ast-analyzer.ts    # AST parsing and analysis
│   │   └── complexity.ts      # Complexity metrics
│   ├── reporters/
│   │   ├── console.ts         # Terminal output
│   │   └── json.ts            # JSON report generation
│   └── types.ts               # TypeScript types
├── tests/                     # Jest tests
└── package.json
```

## Why VibeScan?

AI code generation tools (like GitHub Copilot, ChatGPT, Claude) are powerful but can introduce:

1. **Security vulnerabilities** - Hardcoded secrets, SQL injection, XSS
2. **AI-specific anti-patterns** - Long functions, high complexity, missing error handling
3. **Code quality issues** - Magic numbers, deep nesting, duplicate code

VibeScan specifically targets these issues that are common in AI-generated code.

## Roadmap

- [ ] Auto-fix functionality
- [ ] GitHub Actions integration
- [ ] Web dashboard
- [ ] Custom rule configuration
- [ ] Plugin system
- [ ] IDE extensions (VS Code, IntelliJ)

## Contributing

Contributions welcome! Please read our contributing guidelines first.

## License

MIT

## Credits

Built with:
- [@babel/parser](https://babeljs.io/docs/en/babel-parser) - AST parsing
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal colors
- [TypeScript](https://www.typescriptlang.org/) - Type safety

---

**VibeScan** - Because AI-generated code needs human oversight.
