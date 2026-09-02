/**
 * Debug: test parse result for today's page
 */
import { PrimaryWebXSMBProvider } from '../app/lib/providers/primary-web-provider';
import { PrimaryXSMBParser } from '../app/lib/parsers/primary/primary-xsmb-parser';
import fs from 'fs';
import path from 'path';

if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  process.loadEnvFile(path.resolve(process.cwd(), '.env.local'));
}

async function run() {
  const provider = new PrimaryWebXSMBProvider();
  const parser = new PrimaryXSMBParser();
  const date = '2026-09-02';

  console.log(`Fetching: ${date}`);
  const raw = await provider.fetchByDate(date);
  console.log(`HTTP: ${raw.httpStatus}`);

  const result = parser.parse(raw);
  console.log(`\nParse status: ${result.status}`);
  console.log(`Has data: ${!!result.data}`);
  console.log(`Errors (${result.errors.length}):`);
  result.errors.forEach((e, i) => console.log(`  [${i}] ${e.code}: ${e.message}`));
  console.log(`\nDiagnostics:`, JSON.stringify(result.diagnostics, null, 2));
  if (result.data) {
    console.log(`\nResults:`, JSON.stringify(result.data.results, null, 2));
  }
}

run().catch(e => console.error(e));
