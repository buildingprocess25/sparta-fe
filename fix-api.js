const fs = require('fs');
let content = fs.readFileSync('lib/api.ts', 'utf8');
const index = content.indexOf('export const exportDcData');
if (index !== -1) {
    content = content.substring(0, index);
} else {
    // try finding the bad bytes
    const badIndex = content.indexOf(' e x p o r t');
    if (badIndex !== -1) {
        content = content.substring(0, badIndex);
    }
}
content = content.replace(/\x00/g, ''); // remove all null bytes
fs.writeFileSync('lib/api.ts', content);

// Now append the correct one
const correctCode = `
export const exportDcData = async (id: number, format: 'csv' | 'excel' | 'pdf', actorRole: string, actorEmail: string): Promise<boolean> => {
    const params = new URLSearchParams({ actor_role: actorRole, actor_email: actorEmail });
    const res = await apiFetch(\`\${API_URL.replace(/\\/$/, '')}/api/dc-development/projects/\${id}/export/\${format}?\${params}\`);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Gagal mengunduh laporan');
    }
    const disposition = res.headers.get('Content-Disposition');
    let filename = \`Laporan_DC.\${format === 'excel' ? 'xlsx' : format}\`;
    if (disposition) {
        const match = disposition.match(/filename="?([^";\\n]+)"?/);
        if (match && match[1]) filename = match[1];
    }
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
    return true;
};
`;
fs.appendFileSync('lib/api.ts', correctCode);
console.log('Fixed api.ts');
