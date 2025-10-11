const fs = require('fs');
const data = JSON.parse(fs.readFileSync('.cache/xtrefs-data.json', 'utf8'));
const term = data.xtrefs.find(x => x.externalSpec === 'kor-test' && x.term === 'accreditation');
if (term) {
  console.log('Found term in cache:');
  console.log('  externalSpec:', term.externalSpec);
  console.log('  term:', term.term);
  console.log('  Has content:', !!term.content);
  console.log('  Content length:', term.content ? term.content.length : 0);
  console.log('  Content preview:', term.content ? term.content.substring(0, 300) : 'none');
  console.log('  Source:', term.source);
}
