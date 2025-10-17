#!/usr/bin/env node

import { Command } from 'commander';
import { Scanner } from './scanner';
import { ConsoleReporter } from './reporters/console';
import { JSONReporter } from './reporters/json';
import { VibeScanConfig } from './types';
import { FixerOrchestrator } from './fixers';
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
  .option('--fix', 'Auto-fix simple issues')
  .option('--dry-run', 'Show what would be fixed without making changes')
  .option('-v, --verbose', 'Show detailed output')
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

      // Load config file if exists
      const configPath = path.join(process.cwd(), '.vibescan.json');
      let config: VibeScanConfig = {};

      if (fs.existsSync(configPath)) {
        try {
          const configContent = fs.readFileSync(configPath, 'utf-8');
          config = JSON.parse(configContent);
          if (options.verbose) {
            console.log(`Loaded configuration from ${configPath}`);
          }
        } catch (error) {
          console.error(`Warning: Could not parse .vibescan.json: ${error instanceof Error ? error.message : error}`);
        }
      }

      console.log(`Scanning ${fullPath}...\n`);

      const scanner = new Scanner();
      const result = await scanner.scan({
        directory: fullPath,
        json: options.json,
        fix: options.fix,
        ignore: config.ignore,
        rules: config.rules,
        verbose: options.verbose
      });

      // Auto-fix issues if requested
      if (options.fix || options.dryRun) {
        console.log('\n🔧 Applying auto-fixes...\n');

        const fixer = new FixerOrchestrator();
        const fixableStats = fixer.getFixableStats(result);

        if (fixableStats.total === 0) {
          console.log('No auto-fixable issues found.');
        } else {
          console.log(`Found ${fixableStats.total} fixable issue(s):\n`);
          for (const [fixerName, count] of fixableStats.byFixer) {
            console.log(`  • ${fixerName}: ${count} issue(s)`);
          }
          console.log('');

          if (options.dryRun) {
            console.log('(Dry run - no changes will be made)\n');
          }

          const fixReport = await fixer.fixIssues(result, {
            dryRun: options.dryRun,
            createBackup: true,
            skipConfirmation: true
          });

          if (fixReport.totalFixed > 0) {
            console.log(`\n✅ Fixed ${fixReport.totalFixed} issue(s) in ${fixReport.filesModified} file(s)\n`);

            // Group changes by file
            const changesByFile = new Map<string, string[]>();
            for (const change of fixReport.changes) {
              const [file, ...changeParts] = change.split(': ');
              const changeText = changeParts.join(': ');
              if (!changesByFile.has(file)) {
                changesByFile.set(file, []);
              }
              changesByFile.get(file)!.push(changeText);
            }

            // Display changes grouped by file
            for (const [file, changes] of changesByFile) {
              console.log(`📁 ${file}`);
              for (const change of changes) {
                console.log(`  ✅ ${change}`);
              }
              console.log('');
            }

            if (fixReport.backupDir && !options.dryRun) {
              console.log(`📦 Backups saved to: ${fixReport.backupDir}\n`);
            }

            if (!options.dryRun) {
              console.log('────────────────────────────────────');
              console.log('⚠️  Run your tests to ensure fixes didn\'t break functionality');
              console.log('────────────────────────────────────\n');
            }
          } else {
            console.log('No issues were fixed.\n');
          }

          if (fixReport.errors.length > 0) {
            console.log('\n⚠️  Errors occurred during fixing:\n');
            for (const error of fixReport.errors) {
              console.log(`  • ${error}`);
            }
            console.log('');
          }
        }
      }

      if (options.json || options.output) {
        const jsonReporter = new JSONReporter();
        const output = jsonReporter.report(result);

        if (options.output) {
          // Validate output path
          const outputPath = path.resolve(options.output);

          // Check if file exists
          if (fs.existsSync(outputPath)) {
            console.warn(`⚠️  File ${options.output} already exists and will be overwritten`);
          }

          // Check if directory exists
          const outputDir = path.dirname(outputPath);
          if (!fs.existsSync(outputDir)) {
            console.error(`Error: Directory ${outputDir} does not exist`);
            process.exit(1);
          }

          // Check if writable
          try {
            fs.accessSync(outputDir, fs.constants.W_OK);
          } catch (err) {
            console.error(`Error: No write permission for ${outputDir}`);
            process.exit(1);
          }

          try {
            jsonReporter.writeToFile(result, outputPath);
            console.log(`✅ Report written to ${options.output}`);
          } catch (err) {
            console.error(`Error writing report: ${err instanceof Error ? err.message : err}`);
            process.exit(1);
          }
        } else {
          console.log(output);
        }
      } else if (!options.fix && !options.dryRun) {
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
