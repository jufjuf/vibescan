import { ScanResult } from '../types';
import * as fs from 'fs';

export class JSONReporter {
  report(result: ScanResult): string {
    return JSON.stringify(result, null, 2);
  }

  writeToFile(result: ScanResult, filePath: string): void {
    fs.writeFileSync(filePath, this.report(result), 'utf-8');
  }
}
