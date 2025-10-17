// Example: Using VibeScan programmatically

const { Scanner } = require('./dist/scanner');
const { ConsoleReporter } = require('./dist/reporters/console');
const { JSONReporter } = require('./dist/reporters/json');

async function scanMyCode() {
  const scanner = new Scanner();

  // Scan a directory
  const result = await scanner.scan({
    directory: './demo',
    ignore: ['node_modules', 'dist']
  });

  // Output to console
  const consoleReporter = new ConsoleReporter();
  consoleReporter.report(result);

  // Or export as JSON
  const jsonReporter = new JSONReporter();
  const jsonOutput = jsonReporter.report(result);
  console.log('\nJSON Output:', jsonOutput);

  // Check if build should fail
  if (result.securityScore < 7) {
    console.error('\n❌ Build failed: Security score too low!');
    process.exit(1);
  }
}

scanMyCode();
