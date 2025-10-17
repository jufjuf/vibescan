import chalk from 'chalk';
import { ScanResult, Issue, IssueCategory, IssueSeverity } from '../types';

export class ConsoleReporter {
  report(result: ScanResult): void {
    console.log('\n' + chalk.bold('VibeScan Report'));
    console.log(chalk.gray('═'.repeat(60)) + '\n');

    this.printSummary(result);
    this.printIssuesByCategory(result);
    this.printScores(result);
  }

  private printSummary(result: ScanResult): void {
    console.log(chalk.blue(`📁 Files scanned: ${result.filesScanned}`));
    console.log(this.getIssueColor(result.totalIssues) +
                `⚠️  Issues found: ${result.totalIssues}\n`);
  }

  private printIssuesByCategory(result: ScanResult): void {
    const categories = [
      IssueCategory.SECURITY,
      IssueCategory.AI_PATTERN,
      IssueCategory.CODE_QUALITY
    ];

    categories.forEach(category => {
      const issues = result.issues.filter(i => i.category === category);
      if (issues.length > 0) {
        this.printCategorySection(category, issues);
      }
    });
  }

  private printCategorySection(category: IssueCategory, issues: Issue[]): void {
    const categoryName = this.getCategoryName(category);
    console.log(chalk.bold(`${categoryName} (${issues.length})`));
    console.log(chalk.gray('─'.repeat(60)));

    issues.slice(0, 10).forEach(issue => {
      this.printIssue(issue);
    });

    if (issues.length > 10) {
      console.log(chalk.gray(`  ... and ${issues.length - 10} more\n`));
    } else {
      console.log();
    }
  }

  private printIssue(issue: Issue): void {
    const icon = this.getSeverityIcon(issue.severity);
    const color = this.getSeverityColor(issue.severity);

    console.log(color(`${icon} ${issue.severity}: ${issue.message}`));
    console.log(chalk.gray(`   └─ ${issue.file}:${issue.line}`));

    if (issue.suggestion) {
      console.log(chalk.cyan(`   └─ Suggestion: ${issue.suggestion}`));
    }

    if (issue.code) {
      const truncatedCode = issue.code.length > 80
        ? issue.code.substring(0, 77) + '...'
        : issue.code;
      console.log(chalk.gray(`   └─ ${truncatedCode}`));
    }

    console.log();
  }

  private printScores(result: ScanResult): void {
    console.log(chalk.bold('Summary'));
    console.log(chalk.gray('─'.repeat(60)));

    this.printScore('Security Score', result.securityScore);
    this.printScore('Code Quality', result.qualityScore);
    this.printScore('AI Patterns', result.aiPatternScore);

    console.log();
  }

  private printScore(label: string, score: number): void {
    const color = this.getScoreColor(score);
    const icon = score >= 7 ? '✅' : score >= 5 ? '⚠️' : '❌';
    console.log(`${icon} ${label}: ${color(score.toFixed(1) + '/10')}`);
  }

  private getCategoryName(category: IssueCategory): string {
    const icons = {
      [IssueCategory.SECURITY]: '🔒 Security Issues',
      [IssueCategory.AI_PATTERN]: '🤖 AI Code Patterns',
      [IssueCategory.CODE_QUALITY]: '📊 Code Quality'
    };
    return icons[category];
  }

  private getSeverityIcon(severity: IssueSeverity): string {
    const icons = {
      [IssueSeverity.CRITICAL]: '🔴',
      [IssueSeverity.HIGH]: '🟠',
      [IssueSeverity.MEDIUM]: '🟡',
      [IssueSeverity.LOW]: '🔵',
      [IssueSeverity.INFO]: 'ℹ️'
    };
    return icons[severity];
  }

  private getSeverityColor(severity: IssueSeverity): typeof chalk {
    const colors = {
      [IssueSeverity.CRITICAL]: chalk.red.bold,
      [IssueSeverity.HIGH]: chalk.red,
      [IssueSeverity.MEDIUM]: chalk.yellow,
      [IssueSeverity.LOW]: chalk.blue,
      [IssueSeverity.INFO]: chalk.gray
    };
    return colors[severity];
  }

  private getScoreColor(score: number): typeof chalk {
    if (score >= 7) return chalk.green;
    if (score >= 5) return chalk.yellow;
    return chalk.red;
  }

  private getIssueColor(count: number): typeof chalk {
    if (count === 0) return chalk.green;
    if (count < 10) return chalk.yellow;
    return chalk.red;
  }
}
