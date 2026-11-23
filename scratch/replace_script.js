const fs = require('fs');
const path = require('path');

const filePath = path.resolve('app/opname/page.tsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const target1 = `        Promise.allSettled([
            withFallbackTimeout(fetchRABList(), { data: [] } as any),
            withFallbackTimeout(fetchInstruksiLapanganList({ status: 'Disetujui' }, { suppressGlobalError: true }), { data: [] } as any)
        ])
            .then(([rabResult, instruksiResult]) => {
                const res = rabResult.status === 'fulfilled' ? rabResult.value : { data: [] };
                const instruksiRes = instruksiResult.status === 'fulfilled' ? instruksiResult.value : { data: [] };
                const data = res.data || [];`;

const replacement1 = `        Promise.allSettled([
            withFallbackTimeout(fetchRABList(), { data: [] as RABListItem[] }),
            withFallbackTimeout(fetchInstruksiLapanganList({ status: 'Disetujui' }, { suppressGlobalError: true }), { data: [] as any[] })
        ])
            .then(([rabResult, instruksiResult]) => {
                const res = rabResult.status === 'fulfilled' ? rabResult.value : { data: [] };
                const instruksiRes = instruksiResult.status === 'fulfilled' ? instruksiResult.value : { data: [] };
                const data = (res.data || []) as RABListItem[];`;

const target2 = `                    <CardContent className="p-6 md:p-8 bg-slate-50/50">
                        {/* Section 1: Select ULOK */}
                        <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">`;

const replacement2 = `                    <CardContent className="p-6 md:p-8 bg-slate-50/50">
                        {/* Mode Selector */}
                        <div className="mb-6 flex gap-2 p-1 bg-slate-100 rounded-lg w-full md:w-max mx-auto md:mx-0 shadow-inner">
                            <button
                                onClick={() => setSupportFlowView('legacy')}
                                className={\`px-4 py-2 rounded-md text-sm font-bold transition-all flex-1 md:flex-none \${supportFlowView === 'legacy' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}\`}
                            >
                                Legacy / Finalisasi KTK
                            </button>
                            <button
                                onClick={() => setSupportFlowView('contractor_first')}
                                className={\`px-4 py-2 rounded-md text-sm font-bold transition-all flex-1 md:flex-none \${supportFlowView === 'contractor_first' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}\`}
                            >
                                Contractor-first / Review Revisi
                            </button>
                        </div>

                        {/* Section 1: Select ULOK */}
                        <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">`;

const target3 = `                                    /* Section 2: Form Input */
                                    <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="border-b pb-2 mb-4 flex items-center justify-between">`;

const replacement3 = `                                    {/* Section 2: Form Input */}
                                    {supportFlowView === 'legacy' && (
                                    <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="border-b pb-2 mb-4 flex items-center justify-between">`;

const target4 = `                                    </div>
                                </>) : (
                                    /* History View */
                                    <OpnameHistoryView opnameList={existingOpname} rabItems={rabItems} />
                                )}`;

const replacement4 = `                                    </div>
                                    )}
                                </>) : (
                                    /* History View */
                                    <OpnameHistoryView opnameList={existingOpname} rabItems={rabItems} />
                                )}`;

let hasError = false;
if (!content.includes(target1) && !content.includes(replacement1)) { console.error("Target 1 not found!"); hasError = true; }
if (!content.includes(target2)) { console.error("Target 2 not found!"); hasError = true; }
if (!content.includes(target3)) { console.error("Target 3 not found!"); hasError = true; }
if (!content.includes(target4)) { console.error("Target 4 not found!"); hasError = true; }

if (content.includes(target1)) content = content.replace(target1, replacement1);
if (content.includes(target2)) content = content.replace(target2, replacement2);
if (content.includes(target3)) content = content.replace(target3, replacement3);
if (content.includes(target4)) content = content.replace(target4, replacement4);

fs.writeFileSync(filePath, content);
if (!hasError) console.log("Replacements done successfully.");
