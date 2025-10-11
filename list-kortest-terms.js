const fs = require('fs');
const data = JSON.parse(fs.readFileSync('.cache/xtrefs-data.json', 'utf8'));
const korTestTerms = data.xtrefs.filter(x => x.externalSpec === 'kor-test');
console.log(`Total kor-test terms: ${korTestTerms.length}`);
console.log('\nFirst 10 terms:');
korTestTerms.slice(0, 10).forEach(t => {
  console.log(`  - ${t.term} (content length: ${t.content ? t.content.length : 0}, source: ${t.source})`);
});
const accred = korTestTerms.filter(t => t.term.includes('accredit'));
console.log('\nTerms containing "accredit":');
accred.forEach(t => {
  console.log(`  - ${t.term} (has content: ${!!t.content && t.content !== 'This term was not found in the external repository.'}, length: ${t.content ? t.content.length : 0})`);
});
