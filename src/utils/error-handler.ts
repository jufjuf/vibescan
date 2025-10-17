/**
 * Centralized error handling utilities for consistent error formatting and logging.
 */
export class ErrorHandler {
  /**
   * Format an error of unknown type to a string message.
   *
   * @param error - Error of unknown type
   * @returns Formatted error message
   */
  static formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (typeof error === 'object' && error !== null) {
      return JSON.stringify(error);
    }
    return 'Unknown error';
  }

  /**
   * Log an error with context information.
   * In verbose mode, includes stack traces.
   *
   * @param context - Description of where/what failed
   * @param error - The error that occurred
   * @param verbose - Whether to include detailed stack traces
   */
  static logError(context: string, error: unknown, verbose = false): void {
    const message = this.formatError(error);

    if (verbose) {
      console.error(`❌ ${context}: ${message}`);
      if (error instanceof Error && error.stack) {
        console.error('Stack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(`Error: ${context} - ${message}`);
    }
  }

  /**
   * Log a warning message.
   *
   * @param message - Warning message to display
   * @param context - Optional context information
   */
  static logWarning(message: string, context?: string): void {
    const fullMessage = context ? `⚠️  ${context}: ${message}` : `⚠️  ${message}`;
    console.warn(fullMessage);
  }

  /**
   * Create an error message string with context.
   *
   * @param context - Description of where/what failed
   * @param error - The error that occurred
   * @returns Formatted error message string
   */
  static createErrorMessage(context: string, error: unknown): string {
    return `${context}: ${this.formatError(error)}`;
  }

  /**
   * Safely handle file operation errors with user-friendly messages.
   *
   * @param operation - The file operation being performed
   * @param filePath - Path to the file
   * @param error - The error that occurred
   * @returns User-friendly error message
   */
  static handleFileError(operation: string, filePath: string, error: unknown): string {
    const message = this.formatError(error);

    // Check for common file errors
    if (message.includes('ENOENT')) {
      return `File not found: ${filePath}`;
    }
    if (message.includes('EACCES')) {
      return `Permission denied: ${filePath}`;
    }
    if (message.includes('EISDIR')) {
      return `Expected file but found directory: ${filePath}`;
    }
    if (message.includes('ENOTDIR')) {
      return `Expected directory but found file: ${filePath}`;
    }

    return `Failed to ${operation} ${filePath}: ${message}`;
  }
}
