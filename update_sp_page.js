const fs = require('fs');

const path = 'c:/alfamart/SPARTA/sparta-fe/app/surat-peringatan/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add GroupedSpAction type
if (!content.includes('type GroupedSpAction = {')) {
    content = content.replace(
        'export default function SuratPeringatanPage() {',
        `type GroupedSpAction = {\n    latest: DendaAction;\n    history: DendaAction[];\n};\n\nexport default function SuratPeringatanPage() {`
    );
}

// 2. Change selectedDetailAction to selectedDetailGroup
content = content.replace(
    /const \[selectedDetailAction, setSelectedDetailAction\] = useState<DendaAction \| null>\(null\);/g,
    'const [selectedDetailGroup, setSelectedDetailGroup] = useState<GroupedSpAction | null>(null);'
);

// 3. Replace pendingActions and approvedActions with grouped actions logic
const actionsLogicOld = `    const pendingActions = actions.filter((action) => {
        if (action.action_type !== "SP" || action.status !== "WAITING_MANAGER") return false;
        if (!user || user.roles.includes("SUPER HUMAN")) return true;
        if (user.isHO) return normalize(action.cabang) === "HEAD OFFICE";
        return canAccessBranchForUser(action.cabang ?? "", user.roles ?? [], user.cabang ?? null, getSessionBranchCoverage());
    });
    
    const approvedActions = actions.filter((action) => {
        if (action.action_type !== "SP" || action.status === "WAITING_MANAGER") return false;
        if (!user || user.roles.includes("SUPER HUMAN")) return true;
        if (user.isHO) return normalize(action.cabang) === "HEAD OFFICE";
        return canAccessBranchForUser(action.cabang ?? "", user.roles ?? [], user.cabang ?? null, getSessionBranchCoverage());
    });`;

const actionsLogicNew = `    const groupedActions = useMemo(() => {
        const map = new Map<string, DendaAction[]>();
        actions.forEach(action => {
            if (action.action_type !== "SP") return;
            if (user && !user.roles.includes("SUPER HUMAN")) {
                if (user.isHO && normalize(action.cabang) !== "HEAD OFFICE") return;
                if (!user.isHO && !canAccessBranchForUser(action.cabang ?? "", user.roles ?? [], user.cabang ?? null, getSessionBranchCoverage())) return;
            }
            
            // Group by toko/kontraktor AND SP level, so SP 1 and SP 2 for same store are separate threads
            const key = \`\${action.id_toko || 'no-toko'}-\${normalize(action.nama_kontraktor)}-\${action.sp_level}\`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(action);
        });

        const groups = Array.from(map.values()).map(group => {
            group.sort((a, b) => b.id - a.id); // latest first
            return { latest: group[0], history: group } as GroupedSpAction;
        });
        
        // Sort groups: WAITING_MANAGER first, then by latest ID
        groups.sort((a, b) => {
            if (a.latest.status === "WAITING_MANAGER" && b.latest.status !== "WAITING_MANAGER") return -1;
            if (a.latest.status !== "WAITING_MANAGER" && b.latest.status === "WAITING_MANAGER") return 1;
            return b.latest.id - a.latest.id;
        });

        return groups;
    }, [actions, user]);`;

content = content.replace(actionsLogicOld, actionsLogicNew);

// 4. Update List View rendering
const listViewOld = /<div className="grid gap-3">\s*{\[\.\.\.pendingActions, \.\.\.approvedActions\]\.map\(\(action\) => {[\s\S]*?}\)}\s*<\/div>/;
const listViewNew = `<div className="grid gap-3">
                                {groupedActions.map((group) => {
                                    const action = group.latest;
                                    const isPending = action.status === "WAITING_MANAGER";
                                    const isRejected = action.status === "REJECTED_BY_MANAGER";
                                    return (
                                        <div
                                            key={\`group-\${action.id}\`}
                                            onClick={() => { setSelectedDetailGroup(group); setViewMode("detail"); }}
                                            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-slate-300 flex items-center justify-between gap-3"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={\`shrink-0 w-2 h-10 rounded-full \${isPending ? "bg-amber-400" : isRejected ? "bg-red-400" : "bg-emerald-400"}\`} />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 truncate">
                                                        SP {action.sp_level} &nbsp;&middot;&nbsp; {action.nama_kontraktor || "-"}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-slate-500 truncate">
                                                        {action.nomor_ulok || "—"} &nbsp;&middot;&nbsp; {SP_REASON_LABELS[action.alasan_sp ?? "KETERLAMBATAN"]}
                                                        {action.cabang ? \` · \${action.cabang}\` : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="shrink-0 flex items-center gap-3">
                                                {group.history.length > 1 && (
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full hidden sm:inline-block">
                                                        {group.history.length} Riwayat
                                                    </span>
                                                )}
                                                <Badge className={
                                                    isPending ? "border-amber-200 bg-amber-50 text-amber-700 shadow-none" :
                                                    isRejected ? "border-red-200 bg-red-50 text-red-700 shadow-none" :
                                                    "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none"
                                                }>
                                                    {statusLabel(action.status)}
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>`;

content = content.replace(listViewOld, listViewNew);

// Fix empty state condition
content = content.replace(
    /\(pendingActions\.length === 0 && approvedActions\.length === 0\)/g,
    '(groupedActions.length === 0)'
);

// 5. Update Detail View references
// Change `selectedDetailAction &&` to `selectedDetailGroup &&`
content = content.replace(
    /selectedDetailAction &&/g,
    'selectedDetailGroup &&'
);

// Replace `selectedDetailAction` with `selectedDetailGroup.latest` in most places
content = content.replace(/selectedDetailAction\.nama_kontraktor/g, 'selectedDetailGroup.latest.nama_kontraktor');
content = content.replace(/selectedDetailAction\.nomor_ulok/g, 'selectedDetailGroup.latest.nomor_ulok');
content = content.replace(/selectedDetailAction\.alasan_sp/g, 'selectedDetailGroup.latest.alasan_sp');
content = content.replace(/selectedDetailAction\.sp_level/g, 'selectedDetailGroup.latest.sp_level');
content = content.replace(/selectedDetailAction\.catatan/g, 'selectedDetailGroup.latest.catatan');
content = content.replace(/selectedDetailAction\.status/g, 'selectedDetailGroup.latest.status');
content = content.replace(/selectedDetailAction\.id_toko/g, 'selectedDetailGroup.latest.id_toko');
content = content.replace(/selectedDetailAction\.id/g, 'selectedDetailGroup.latest.id');

// Add History Timeline to Detail View
const timelineHtml = `
                                {selectedDetailGroup.history.length > 1 && (
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mt-6">
                                        <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Riwayat Pengajuan</h3>
                                        <div className="space-y-4">
                                            {selectedDetailGroup.history.map((hist, idx) => (
                                                <div key={hist.id} className={\`relative pl-6 \${idx !== selectedDetailGroup.history.length - 1 ? "border-l-2 border-slate-100 pb-4" : ""}\`}>
                                                    <div className={\`absolute -left-[5px] top-1 w-2 h-2 rounded-full \${hist.status === "WAITING_MANAGER" ? "bg-amber-400" : hist.status === "REJECTED_BY_MANAGER" ? "bg-red-400" : "bg-emerald-400"}\`} />
                                                    <p className="text-xs font-bold text-slate-500 mb-1">{new Date(hist.created_at || Date.now()).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge className={\`text-[10px] px-2 py-0 \${hist.status === "WAITING_MANAGER" ? "bg-amber-50 text-amber-700 border-amber-200" : hist.status === "REJECTED_BY_MANAGER" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}\`}>{statusLabel(hist.status)}</Badge>
                                                    </div>
                                                    {hist.catatan && <p className="text-sm text-slate-700 mt-1">Catatan: {hist.catatan}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
`;

content = content.replace(
    /(\{selectedDetailGroup\.latest\.status === "WAITING_MANAGER" && userCanApprove && \()/g,
    timelineHtml + '\n$1'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Update script finished successfully.');
