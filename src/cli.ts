#!/usr/bin/env node

import { Command } from 'commander';
import { Scanner } from './scanner';
import { ConsoleReporter } from './reporters/console';
import { JSONReporter } from './reporters/json';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('vibescan')
  .description('AI Code Security & Quality Auditor')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan a directory for security and quality issues')
  .argument('<directory>', 'Directory to scan')
  .option('-j, --json', 'Output as JSON')
  .option('-o, --output <file>', 'Write JSON output to file')
  .option('--fix', 'Auto-fix simple issues (not implemented yet)')
  .action(async (directory: string, options: any) => {
    try {
      // Validate directory
      const fullPath = path.resolve(directory);
      if (!fs.existsSync(fullPath)) {
        console.error(`Error: Directory "${directory}" does not exist`);
        process.exit(1);
      }

      if (!fs.statSync(fullPath).isDirectory()) {
        console.error(`Error: "${directory}" is not a directory`);
        process.exit(1);
      }

      console.log(`Scanning ${fullPath}...\n`);

      const scanner = new Scanner();
      const result = await scanner.scan({
        directory: fullPath,
        json: options.json,
        fix: options.fix
      });

      if (options.json || options.output) {
        const jsonReporter = new JSONReporter();
        const output = jsonReporter.report(result);

        if (options.output) {
          jsonReporter.writeToFile(result, options.output);
          console.log(`Report written to ${options.output}`);
        } else {
          console.log(output);
        }
      } else {
        const consoleReporter = new ConsoleReporter();
        consoleReporter.report(result);
      }

      // Exit with error code if critical issues found
      const criticalIssues = result.issues.filter(i => i.severity === 'CRITICAL');
      if (criticalIssues.length > 0) {
        process.exit(1);
      }

    } catch (error) {
      console.error('Error during scan:', error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Create .vibescan.json configuration file')
  .action(() => {
    const config = {
      ignore: [
        'node_modules',
        'dist',
        'build',
        '.next',
        'coverage'
      ],
      rules: {
        maxFunctionLength: 50,
        maxComplexity: 10,
        maxParameters: 5,
        maxNestingDepth: 3
      }
    };

    const configPath = path.join(process.cwd(), '.vibescan.json');

    if (fs.existsSync(configPath)) {
      console.error('Error: .vibescan.json already exists');
      process.exit(1);
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('Created .vibescan.json configuration file');
  });

program.parse();
