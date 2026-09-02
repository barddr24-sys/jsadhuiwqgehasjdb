/**
 * Debug: test parse result for a known historical date
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
  const date = '2024-09-02'; // Known complete date

  console.log(`Fetching: ${date}`);
  const raw = await provider.fetchByDate(date);
  console.log(`HTTP: ${raw.httpStatus}`);

  const result = parser.parse(raw);
  console.log(`\nParse status: ${result.status}`);
  console.log(`Has data: ${!!result.data}`);
  console.log(`Strategy: ${result.diagnostics?.parsingStrategy}`);
  console.log(`Errors (${result.errors.length}):`);
  result.errors.forEach((e, i) => console.log(`  [${i}] ${e.code}: ${e.message}`));
  if (result.data) {
    console.log(`\nResults:`);
    const r = result.data.results;
    console.log(`  special:     ${JSON.stringify(r.special)}`);
    console.log(`  firstPrize:  ${JSON.stringify(r.firstPrize)}`);
    console.log(`  secondPrize: ${JSON.stringify(r.secondPrize)}`);
    console.log(`  thirdPrize:  ${JSON.stringify(r.thirdPrize)}`);
    console.log(`  fourthPrize: ${JSON.stringify(r.fourthPrize)}`);
    console.log(`  fifthPrize:  ${JSON.stringify(r.fifthPrize)}`);
    console.log(`  sixthPrize:  ${JSON.stringify(r.sixthPrize)}`);
    console.log(`  seventhPrize:${JSON.stringify(r.seventhPrize)}`);
    const total = Object.values(r).reduce((s, arr) => s + arr.length, 0);
    console.log(`\n  TOTAL: ${total}/27`);
  }
}

run().catch(e => console.error(e));
