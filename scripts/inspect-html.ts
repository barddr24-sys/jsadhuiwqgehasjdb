import * as cheerio from 'cheerio';
import { PrimaryWebXSMBProvider } from '../app/lib/providers/primary-web-provider';
import fs from 'fs';
import path from 'path';

if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  process.loadEnvFile(path.resolve(process.cwd(), '.env.local'));
}

async function inspect() {
  const provider = new PrimaryWebXSMBProvider();
  const raw = await provider.fetchByDate('2024-09-02');
  const $ = cheerio.load(raw.rawBody);

  console.log('--- Page title ---');
  console.log($('title').text());

  console.log('\n--- All tables on page ---');
  $('table').each((i, el) => {
    console.log(`Table ${i}: class="${$(el).attr('class')}" id="${$(el).attr('id')}" data-attr="${$(el).attr('data-table') || ''}" rows=${$(el).find('tr').length}`);
  });

  console.log('\n--- Containers containing lottery result ---');
  $('.table-xsmb, .bkq-table, .box_kqxs, .kq-table, .content-table, .box_kqxs_mb, #box_kqxs_mb, table[class*="kq"], table[class*="xsmb"]').each((i, el) => {
    console.log(`Matched container ${i}: tag=${el.tagName} class="${$(el).attr('class')}" id="${$(el).attr('id')}"`);
  });

  // Let's print the first table rows and cell text
  $('table').each((i, el) => {
    console.log(`\n=== TABLE ${i} (${$(el).attr('class')}) ===`);
    $(el).find('tr').slice(0, 10).each((j, tr) => {
      const cells: string[] = [];
      $(tr).find('td, th').each((k, cell) => {
        cells.push(`[${$(cell).attr('class') || ''}]: "${$(cell).text().trim().replace(/\s+/g, ' ')}"`);
      });
      console.log(`Row ${j} (class="${$(tr).attr('class') || ''}"): ${cells.join(' | ')}`);
    });
  });
}

inspect();
