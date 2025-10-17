# VibeScan

<!-- VIBESCAN-BADGES-START -->
<!-- VIBESCAN-BADGES-END -->

**AI Code Security & Quality Auditor** - Detect vulnerabilities and anti-patterns in AI-generated code

VibeScan is a CLI tool that scans JavaScript/TypeScript code for security vulnerabilities, code quality issues, and AI-specific anti-patterns. Research shows that 45% of AI-generated code has security flaws - VibeScan helps you catch them before deployment.

## Features

✅ **Auto-Fix Issues** - Automatically fix security and quality issues
✅ **GitHub Actions Integration** - CI/CD scanning with PR comments
✅ **Web Dashboard** - Visual analytics and drill-down reports
✅ **Smart Scanning** - AST-based analysis for accuracy

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

### Auto-fix issues

```bash
# Preview fixes without applying them
vibescan scan ./src --dry-run

# Apply fixes automatically
vibescan scan ./src --fix

# Combine with other options
vibescan scan ./src --fix --json -o report.json
```

Supports auto-fixing:
- Hardcoded secrets → Environment variables
- Magic numbers → Named constants
- Missing error handlers → Try-catch blocks
- TODO comments → Removed

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

## GitHub Actions Integration

VibeScan integrates seamlessly with GitHub Actions for automated code quality checks in your CI/CD pipeline.

### Quick Setup

1. Copy the workflow files to your repository:
```bash
mkdir -p .github/workflows
curl -o .github/workflows/vibescan.yml https://raw.githubusercontent.com/jufjuf/vibescan/main/.github/workflows/vibescan.yml
curl -o .github/workflows/update-badges.yml https://raw.githubusercontent.com/jufjuf/vibescan/main/.github/workflows/update-badges.yml
```

2. Enable Actions permissions:
   - Go to Settings → Actions → General
   - Set "Workflow permissions" to "Read and write permissions"

3. Add badge placeholders to your README:
```markdown
<!-- VIBESCAN-BADGES-START -->
<!-- VIBESCAN-BADGES-END -->
```

### Features

- **Automatic PR Comments** - Detailed scan results posted to pull requests
- **Status Checks** - Block merges if critical issues found
- **Badge Generation** - Auto-update README with latest scores
- **Artifact Storage** - Keep scan reports for 30 days

See [GITHUB_ACTIONS.md](docs/GITHUB_ACTIONS.md) for detailed setup and configuration.

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

- [x] Auto-fix functionality
- [x] GitHub Actions integration
- [x] Web dashboard (structure complete, needs Tailwind fix)
- [x] Custom rule configuration
- [ ] Plugin system
- [ ] IDE extensions (VS Code, IntelliJ)
- [ ] npm package publishing
- [ ] Performance optimizations

## Security

VibeScan takes security seriously. For information about security features and reporting vulnerabilities, see [SECURITY.md](SECURITY.md).

**Key Security Features:**
- AST-based code analysis (no code execution)
- File path validation
- Automatic backups before modifications
- Rate limiting on API endpoints
- Secure file upload handling

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
