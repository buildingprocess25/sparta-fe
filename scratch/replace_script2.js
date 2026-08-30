const fs = require('fs');
const path = require('path');

const filePath = path.resolve('app/opname/page.tsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const target1 = `        Promise.allSettled([
            withFallbackTimeout(fetchRABList(), { data: [] as RABListItem[] }),
            withFallbackTimeout(fetchInstruksiLapanganList({ status: 'Disetujui' }, { suppressGlobalError: true }), { data: [] as any[] })
        ])`;

const replacement1 = `        Promise.allSettled([
            withFallbackTimeout(fetchRABList(), { status: 'error', data: [] as RABListItem[] }),
            withFallbackTimeout(fetchInstruksiLapanganList({ status: 'Disetujui' }, { suppressGlobalError: true }), { status: 'error', data: [] as any[] })
        ])`;

if (content.includes(target1)) {
    content = content.replace(target1, replacement1);
    fs.writeFileSync(filePath, content);
    console.log("Replacements done successfully.");
} else {
    console.error("Target 1 not found!");
}
