import * as cheerio from 'cheerio';
import { PrimaryWebXSMBProvider } from '../app/lib/providers/primary-web-provider';
import fs from 'fs';
import path from 'path';

if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  process.loadEnvFile(path.resolve(process.cwd(), '.env.local'));
}

async function main() {
  const p = new PrimaryWebXSMBProvider();
  const res = await p.fetchByDate('2025-01-15');
  const $ = cheerio.load(res.rawBody);
  $('table.table-result tr').each((i, tr) => {
    console.log(`\nRow ${i}:`);
    $(tr).children().each((j, cell) => {
      console.log(`  Cell ${j} (${cell.tagName}, class="${$(cell).attr('class')}"): html="${$(cell).html()}" text="${$(cell).text().trim()}"`);
    });
  });
}

main();
