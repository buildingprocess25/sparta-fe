const fs = require('fs');
let content = fs.readFileSync('lib/api.ts', 'utf8');
const index = content.indexOf('export const exportDcData');
const secondIndex = content.indexOf('export const exportDcData', index + 1);
if (secondIndex !== -1) {
    content = content.substring(0, secondIndex).trim() + '\n';
    fs.writeFileSync('lib/api.ts', content);
    console.log('Removed duplicate exportDcData');
} else {
    console.log('No duplicate found');
}
