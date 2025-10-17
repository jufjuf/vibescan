# Contributing to VibeScan

Thank you for your interest in contributing to VibeScan! This project follows vibecoding principles - fast iteration, AI-assisted development, and continuous improvement.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/vibescan.git`
3. Install dependencies: `npm install`
4. Build the project: `npm run build`
5. Run tests: `npm test`

## 💡 How to Contribute

### Reporting Bugs

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Code sample that triggers the issue
- Your environment (OS, Node version)

### Suggesting Features

Have an idea? Open an issue with:
- Use case and motivation
- Proposed implementation (if any)
- Examples of how it would work

### Submitting Pull Requests

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass: `npm test`
5. Commit with a clear message: `git commit -m "feat: add amazing feature"`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📝 Coding Guidelines

### Vibe Coding Principles

- **Speed over perfection initially** - Ship fast, iterate based on feedback
- **AI-assisted development welcome** - Use Claude Code, Cursor, Copilot, etc.
- **Test-driven refinement** - Add tests for all new features
- **Keep functions small** - Max 30 lines per function
- **Self-documenting code** - Clear names > comments

### Code Style

- TypeScript with strict mode
- ESLint + Prettier for formatting
- Functional programming patterns preferred
- Async/await over callbacks
- Clear error handling

### Testing

- Write tests for all new features
- Maintain 80%+ code coverage
- Test edge cases and error conditions
- Use descriptive test names

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Maintenance tasks

Examples:
```
feat: add ReDoS pattern detection
fix: handle empty files gracefully
docs: update installation instructions
test: add tests for SQL injection detection
```

## 🎯 Priority Areas

Looking for contribution ideas? Here are high-impact areas:

1. **Security Rules** - Add more vulnerability detection patterns
2. **AI Patterns** - Identify new AI-generated code anti-patterns
3. **Language Support** - Extend beyond JavaScript/TypeScript
4. **Auto-fix** - Implement automatic fixes for common issues
5. **Performance** - Optimize scanning for large codebases
6. **CI/CD Integration** - GitHub Actions, GitLab CI plugins
7. **Documentation** - Tutorials, examples, use cases

## 🤝 Code Review Process

All submissions require review. We'll aim to:
- Respond to PRs within 48 hours
- Provide constructive feedback
- Help you improve your contribution
- Merge quickly if all checks pass

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 💬 Questions?

- Open an issue for technical questions
- Reach out to [@jufjuf](https://github.com/jufjuf) for anything else

## 🌟 Recognition

All contributors will be:
- Listed in README.md
- Mentioned in release notes
- Given credit in documentation

Thank you for helping make VibeScan better!
