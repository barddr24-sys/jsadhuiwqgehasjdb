/**
 * Debug: fetch today's page and dump raw structure
 */
import * as cheerio from 'cheerio';
import { PrimaryWebXSMBProvider } from '../app/lib/providers/primary-web-provider';
import fs from 'fs';
import path from 'path';

if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  process.loadEnvFile(path.resolve(process.cwd(), '.env.local'));
}

async function inspect() {
  const provider = new PrimaryWebXSMBProvider();
  // Use TODAY's actual date
  const date = '2026-09-02';
  console.log(`Fetching date: ${date}`);
  const raw = await provider.fetchByDate(date);
  console.log(`HTTP: ${raw.httpStatus}, size: ${raw.rawBody.length} bytes`);
  const $ = cheerio.load(raw.rawBody);

  console.log('\n--- Page title ---');
  console.log($('title').text());

  console.log('\n--- All tables on page ---');
  $('table').each((i, el) => {
    console.log(`Table ${i}: class="${$(el).attr('class')}" rows=${$(el).find('tr').length}`);
  });

  console.log('\n--- table-result rows ---');
  $('table.table-result tr').each((i, tr) => {
    const cells: string[] = [];
    $(tr).find('td, th').each((_, cell) => {
      const clone = $(cell).clone();
      clone.find('br').replaceWith(' ');
      cells.push(`[${$(cell).attr('class') || ''}]: "${clone.text().trim().replace(/\s+/g, ' ')}"`);
    });
    console.log(`Row ${i}: ${cells.join(' | ')}`);
  });

  // Also check .name-prize and .number-prize
  console.log('\n--- .number-prize elements ---');
  $('.number-prize').each((i, el) => {
    const clone = $(el).clone();
    clone.find('br').replaceWith(' ');
    console.log(`[${i}] class="${$(el).attr('class')}": "${clone.text().trim().replace(/\s+/g, ' ')}"`);
  });

  // Save full HTML for manual inspection
  const outPath = path.resolve(process.cwd(), 'scripts/today-debug.html');
  fs.writeFileSync(outPath, raw.rawBody, 'utf8');
  console.log(`\nFull HTML saved to: ${outPath}`);
}

inspect().catch(e => console.error(e));
