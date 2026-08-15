const fs = require('fs');
let content = fs.readFileSync('lib/api.ts', 'utf8');

const toAppend = `
export async function exportGlobalDcData(
  query: DcArchiveProjectListQuery,
  actor: { actor_email: string; actor_role: string },
  format: 'csv' | 'excel' | 'pdf'
): Promise<void> {
  const params = new URLSearchParams();
  if (query.search) params.append('search', query.search);
  if (query.branch_name) params.append('branch_name', query.branch_name);
  if (query.status) params.append('status', query.status);
  params.append('actor_email', actor.actor_email);
  params.append('actor_role', actor.actor_role);

  const url = \`\${API_URL}/dc-development/archive-projects/export/\${format}?\${params.toString()}\`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': format === 'csv' ? 'text/csv' : format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('Gagal mengunduh file: ' + errorText);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  
  // Extract filename from Content-Disposition if available
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = \`Data_Global_DC.\${format === 'excel' ? 'xlsx' : format}\`;
  if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
    const matches = /filename="([^"]+)"/.exec(contentDisposition);
    if (matches != null && matches[1]) {
      filename = matches[1];
    }
  }

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
`;

fs.appendFileSync('lib/api.ts', toAppend);
console.log('Appended exportGlobalDcData');
