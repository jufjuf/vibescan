import { BaseFixer, FixResult } from './base-fixer';
import { Issue } from '../types';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

export class CleanupFixer extends BaseFixer {
  name = 'cleanup-fixer';

  canFix(issue: Issue): boolean {
    return issue.message.includes('TODO') ||
           issue.message.includes('FIXME') ||
           issue.message.includes('commented out code');
  }

  async fix(filePath: string, issue: Issue, sourceCode: string): Promise<FixResult> {
    try {
      const ast = parse(sourceCode, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx']
      });

      const changes: string[] = [];

      // Track comments to remove
      const commentsToRemove = new Set<any>();

      // Remove TODO/FIXME comments
      if (ast.comments) {
        for (const comment of ast.comments) {
          if (this.isTodoOrFixme(comment.value)) {
            commentsToRemove.add(comment);
            changes.push(`Removed ${this.getCommentType(comment.value)} comment`);
          }
        }
      }

      // Filter out removed comments
      ast.comments = ast.comments?.filter(c => !commentsToRemove.has(c));

      // Remove commented out code blocks
      traverse(ast, {
        enter: (path) => {
          const { leadingComments, trailingComments } = path.node;

          if (leadingComments) {
            const filteredLeading = leadingComments.filter(comment => {
              if (this.looksLikeCommentedCode(comment.value)) {
                changes.push('Removed commented out code block');
                return false;
              }
              return true;
            });
            path.node.leadingComments = filteredLeading.length > 0 ? filteredLeading : undefined;
          }

          if (trailingComments) {
            const filteredTrailing = trailingComments.filter(comment => {
              if (this.looksLikeCommentedCode(comment.value)) {
                changes.push('Removed commented out code block');
                return false;
              }
              return true;
            });
            path.node.trailingComments = filteredTrailing.length > 0 ? filteredTrailing : undefined;
          }
        }
      });

      if (changes.length === 0) {
        return this.createFailureResult(sourceCode, 'No cleanup items found');
      }

      const output = generate(ast, {
        retainLines: false,
        compact: false,
        comments: true
      });

      return this.createSuccessResult(sourceCode, output.code, changes);
    } catch (error) {
      return this.createFailureResult(
        sourceCode,
        `Failed to clean up code: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private isTodoOrFixme(commentText: string): boolean {
    const normalized = commentText.trim().toUpperCase();
    return normalized.startsWith('TODO') ||
           normalized.startsWith('FIXME') ||
           normalized.startsWith('HACK') ||
           normalized.startsWith('XXX');
  }

  private getCommentType(commentText: string): string {
    const normalized = commentText.trim().toUpperCase();
    if (normalized.startsWith('TODO')) return 'TODO';
    if (normalized.startsWith('FIXME')) return 'FIXME';
    if (normalized.startsWith('HACK')) return 'HACK';
    if (normalized.startsWith('XXX')) return 'XXX';
    return 'cleanup';
  }

  private looksLikeCommentedCode(commentText: string): boolean {
    const text = commentText.trim();

    // Check for common code patterns
    const codePatterns = [
      /^(const|let|var|function|class|if|for|while|return|import|export)\s+/,
      /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*[=:({]/,
      /^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/,
      /^.*[;{}()[\]]\s*$/,
      /^.*\s+(return|const|let|var)\s+/
    ];

    // Must match at least one pattern
    const hasCodePattern = codePatterns.some(pattern => pattern.test(text));

    // But exclude documentation-style comments
    const isDocumentation = text.startsWith('*') ||
                           text.startsWith('@') ||
                           text.includes('Description:') ||
                           text.includes('Example:') ||
                           text.includes('Note:');

    // Exclude short comments (likely actual comments, not code)
    const isTooShort = text.length < 10;

    return hasCodePattern && !isDocumentation && !isTooShort;
  }
}
