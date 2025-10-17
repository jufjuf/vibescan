# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in VibeScan, please report it by emailing the maintainer or creating a private security advisory on GitHub.

**Please do not** create public GitHub issues for security vulnerabilities.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

---

## Security Features

VibeScan includes several security features to protect both the tool itself and the code it analyzes:

### CLI Tool Security

✅ **File Path Validation**
- Input paths are validated before processing
- Protection against directory traversal attacks
- Safe file operations using Node.js fs module

✅ **AST-Based Code Analysis**
- Uses Babel parser for safe code analysis
- No `eval()` or `Function()` constructor usage
- No arbitrary code execution

✅ **Safe Auto-Fix**
- AST-based code generation (no string concatenation)
- Automatic backups before modification
- Dry-run mode for preview

✅ **Secure Secret Detection**
- Detects hardcoded API keys, passwords, tokens
- Helps move secrets to environment variables
- No secrets stored or transmitted

### Web Dashboard Security

✅ **File Upload Protection** (v1.0.0+)
- Filename sanitization (prevents path traversal)
- File type validation (only .js, .ts, .jsx, .tsx, .mjs, .cjs)
- File size limits (10MB per file, 50MB total)
- Maximum file count limit (100 files)

✅ **Rate Limiting** (v1.0.0+)
- 10 requests per minute per IP
- Prevents denial-of-service attacks
- HTTP 429 response with Retry-After header

✅ **Automatic Cleanup**
- Uploaded files deleted after 1 hour
- Prevents disk space exhaustion

✅ **Error Message Sanitization**
- Generic error messages to clients
- Detailed errors logged server-side only
- No internal implementation details exposed

### GitHub Actions Security

✅ **Minimal Permissions**
- Workflows use principle of least privilege
- Only required permissions granted:
  - `contents: read` - Read repository code
  - `pull-requests: write` - Comment on PRs
  - `checks: write` - Update status checks
  - `statuses: write` - Create commit statuses

✅ **No Secret Exposure**
- Uses GitHub's GITHUB_TOKEN (auto-rotating)
- No custom secrets required
- No hardcoded credentials

✅ **Safe Workflow Execution**
- No arbitrary code execution
- Input sanitization in PR comments
- Protected from injection attacks

---

## Known Limitations

### CLI Tool

**Not a Sandbox**
- VibeScan reads and analyzes files but does not execute them
- Files with malicious code should still be handled carefully
- Use in isolated environments when scanning untrusted code

**File System Access**
- VibeScan requires read access to scan directories
- Auto-fix requires write access to modify files
- Backups are created in `.vibescan-backup/` directory

### Web Dashboard

**In-Memory Rate Limiting**
- Current implementation uses in-memory storage
- Rate limits reset on server restart
- For production, use Redis or similar persistent storage

**File Storage**
- Uploaded files stored on server disk temporarily
- 1-hour automatic cleanup
- Consider using cloud storage for production scale

**No Authentication**
- Dashboard has no built-in authentication
- Deploy behind authentication layer (OAuth, etc.) for production
- Consider using Vercel/Next.js authentication

---

## Security Best Practices

### For VibeScan Users

1. **Environment Variables**
   - Store secrets in `.env` files (not in code)
   - Use VibeScan's auto-fix to move hardcoded secrets
   - Add `.env` to `.gitignore`

2. **Code Review**
   - Review auto-fix changes before committing
   - Run tests after using auto-fix
   - Check backup files if needed

3. **GitHub Actions**
   - Review workflow files before enabling
   - Use branch protection rules
   - Monitor workflow runs for suspicious activity

4. **Dashboard Deployment**
   - Deploy behind authentication
   - Use HTTPS only
   - Set up monitoring and alerting
   - Configure rate limiting for production load

### For VibeScan Contributors

1. **Code Review**
   - All PRs require review before merge
   - Security-sensitive changes require extra scrutiny
   - Run tests before submitting PR

2. **Dependencies**
   - Keep dependencies up to date
   - Run `npm audit` regularly
   - Review dependency changes in PRs

3. **Testing**
   - Write tests for new features
   - Include security tests for sensitive code
   - Test error handling and edge cases

---

## Security Checklist

Before deploying VibeScan (CLI or Dashboard):

- [ ] Review security policy
- [ ] Configure authentication (dashboard only)
- [ ] Set up HTTPS
- [ ] Enable monitoring and logging
- [ ] Configure rate limiting (production scale)
- [ ] Set up backup storage (if needed)
- [ ] Review GitHub Actions permissions
- [ ] Set up security alerts (Dependabot, etc.)
- [ ] Test file upload limits (dashboard)
- [ ] Verify error messages don't leak sensitive info

---

## Security Updates

### v1.0.0 (October 2025)

**Dashboard Security Improvements:**
- Added filename sanitization (fixes path traversal vulnerability)
- Added file type validation
- Added file size limits (10MB per file, 50MB total)
- Added rate limiting (10 req/min per IP)
- Added automatic file cleanup (1 hour TTL)
- Sanitized error messages

**Backup System:**
- Improved backup logic clarity
- Verified backup creation works correctly

---

## Contact

For security concerns, contact:
- **GitHub**: [@jufjuf](https://github.com/jufjuf)
- **Repository**: https://github.com/jufjuf/vibescan/security

---

## Acknowledgments

Security audits performed by:
- Claude Code Security Auditor
- Manual code review

We appreciate responsible disclosure of security vulnerabilities.

---

**Last Updated**: October 17, 2025
**Version**: 1.0.0
