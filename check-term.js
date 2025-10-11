const fs = require('fs');
const html = fs.readFileSync('./docs/index.html', 'utf8');
const match = html.match(/const allXTrefs = ({[\s\S]*?});[\s\S]*?<\/script>/);
if (match) {
  const data = JSON.parse(match[1]);
  const term = data.xtrefs.find(x => x.externalSpec === 'kor-test' && x.term === 'accreditation');
  if (term) {
    console.log('Term:', term.term);
    console.log('Has content:', !!term.content && term.content !== 'This term was not found in the external repository.');
    console.log('Content length:', term.content ? term.content.length : 0);
    console.log('Content preview:', term.content ? term.content.substring(0, 300) : 'none');
  }
}
