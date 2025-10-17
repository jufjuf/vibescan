import { ScanResult } from '../types';

export class JSONReporter {
  report(result: ScanResult): string {
    return JSON.stringify(result, null, 2);
  }

  writeToFile(result: ScanResult, filePath: string): void {
    const fs = require('fs');
    fs.writeFileSync(filePath, this.report(result), 'utf-8');
  }
}
