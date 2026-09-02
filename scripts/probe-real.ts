import { PrimaryWebXSMBProvider } from '../app/lib/providers/primary-web-provider';
import { PrimaryXSMBParser } from '../app/lib/parsers/primary/primary-xsmb-parser';
import { strictXSMBValidator } from '../app/lib/validator/strict-xsmb-validator';
import fs from 'fs';
import path from 'path';

if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  process.loadEnvFile(path.resolve(process.cwd(), '.env.local'));
}

async function run() {
  console.log('Provider Base URL:', process.env.XSMB_PRIMARY_SOURCE_URL);
  const provider = new PrimaryWebXSMBProvider();
  const parser = new PrimaryXSMBParser();

  // Test with a real date known to have XSMB results
  const testDate = '2024-09-02';
  console.log(`\n--- Fetching real date: ${testDate} ---`);
  const startFetch = Date.now();
  try {
    const raw = await provider.fetchByDate(testDate);
    const fetchDur = Date.now() - startFetch;
    console.log(`Fetch success in ${fetchDur}ms: status=${raw.httpStatus}, size=${raw.rawBody.length} bytes`);

    console.log(`\n--- Parsing ---`);
    const parseResult = parser.parse(raw);
    console.log('Parse status:', parseResult.status);
    console.log('Extracted date:', parseResult.diagnostics?.extractedDate);
    console.log('Parsing strategy:', parseResult.diagnostics?.parsingStrategy);
    console.log('Extracted counts:', parseResult.diagnostics?.extractedCounts);
    console.log('Prizes:', JSON.stringify(parseResult.data?.results, null, 2));
    if (parseResult.errors.length > 0) {
      console.log('Parse errors:', parseResult.errors);
    }

    if (parseResult.data) {
      console.log(`\n--- Validating ---`);
      const valResult = strictXSMBValidator.validate(parseResult.data, {
        expectedDrawDate: testDate,
      });
      console.log('Validation valid:', valResult.valid);
      console.log('Validation status:', valResult.status);
      console.log('Validation errors:', valResult.errors);
      console.log('Diagnostics:', valResult.diagnostics);
    }
  } catch (err) {
    console.error('Fetch/Parse failed:', err);
  }
}

run();
