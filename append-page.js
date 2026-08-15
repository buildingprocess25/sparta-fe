const fs = require('fs');
let code = fs.readFileSync('app/dc-development/documents/page.tsx', 'utf8');

// Add imports
if (!code.includes('DropdownMenu')) {
    code = code.replace(
        'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";',
        'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";\nimport { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";'
    );
}

if (code.includes('fetchDcArchiveProjects, type DcArchiveProject')) {
    code = code.replace(
        'fetchDcArchiveProjects, type DcArchiveProject',
        'fetchDcArchiveProjects, exportGlobalDcData, type DcArchiveProject'
    );
}

// Add handleExportGlobal function inside component
const funcToAdd = `
  const handleExportGlobal = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!actor.actor_email || !actor.actor_role) return;
    try {
      const queryParams: any = {
        search: query.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        branch_name: branchFilter !== 'all' ? branchFilter : undefined,
      };
      
      await exportGlobalDcData(queryParams, actor, format);
    } catch (error) {
      setMessage(getErrorMessage(error, "Gagal mengunduh file ekspor"));
    }
  };
`;
if (!code.includes('handleExportGlobal')) {
    code = code.replace(
        'const isHOUser = useMemo(() => (',
        funcToAdd + '\n  const isHOUser = useMemo(() => ('
    );
}

// Add Dropdown button next to branchFilter Select
const uiToAdd = `
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-red-600">
                      <Download className="mr-2 h-4 w-4" />
                      Ekspor Data
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px] rounded-xl">
                    <DropdownMenuItem onClick={() => handleExportGlobal('csv')} className="cursor-pointer gap-2 py-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      Unduh CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportGlobal('excel')} className="cursor-pointer gap-2 py-2">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                      Unduh Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportGlobal('pdf')} className="cursor-pointer gap-2 py-2">
                      <FileDown className="h-4 w-4 text-red-500" />
                      Unduh PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
`;

if (!code.includes('Ekspor Data')) {
    code = code.replace(
        '</SelectContent>\n                </Select>\n              </div>',
        '</SelectContent>\n                </Select>\n' + uiToAdd + '              </div>'
    );
}

fs.writeFileSync('app/dc-development/documents/page.tsx', code);
console.log('Updated page.tsx');
