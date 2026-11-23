import re
with open("app/gantt/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Patch 1: insert useEffect
pattern1 = r"(const \[memoInputs, setMemoInputs\] = useState<.*?\}\);)\n(\s*const \[isDirty, setIsDirty\] = useState\(false\);)"
replacement1 = r"""\1

    useEffect(() => {
        if (!isContractorSubmit) return;
        if (contractorOpnames.size === 0) return;

        setMemoInputs(prev => {
            const next = { ...prev };
            let changed = false;
            contractorOpnames.forEach((op, key) => {
                if (op.status === 'ditolak' && !next[key]?.opnameTouched) {
                    next[key] = {
                        ...(next[key] || {}),
                        volume_akhir: op.volume_akhir,
                        desain: op.desain,
                        kualitas: op.kualitas,
                        spesifikasi: op.spesifikasi,
                        catatan_opname: op.catatan,
                        existing_foto: op.foto,
                        opnameTouched: true
                    };
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [contractorOpnames, isContractorSubmit]);

\2"""
content = re.sub(pattern1, replacement1, content, count=1)

# Patch 2: handleContractorSubmit
pattern2 = r"(const existingOpnameKey = rItemForExisting \? getWorkItemKey\(rItemForExisting\) : key;)\n(\s*if \(contractorOpnames\.has\(existingOpnameKey\) \|\| contractorOpnames\.has\(key\)\) continue;)"
replacement2 = r"""\1
                const existingOp = contractorOpnames.get(existingOpnameKey) || contractorOpnames.get(key);
                if (existingOp && existingOp.status !== 'ditolak') continue;"""
content = re.sub(pattern2, replacement2, content, count=1)

# Patch 3: opnameForStatus
pattern3 = r"(opnameForStatus \? \(\n\s*<div className=\"p-3 bg-slate-50 border border-slate-200 rounded-lg text-center\">\n\s*<span className=\"text-xs font-semibold text-slate-600\">Opname sudah diajukan</span>)"
replacement3 = r"opnameForStatus && opnameForStatus.status !== 'ditolak' ? (\n                                                                                    <div className=\"p-3 bg-slate-50 border border-slate-200 rounded-lg text-center\">\n                                                                                        <span className=\"text-xs font-semibold text-slate-600\">Opname sudah diajukan</span>"
content = re.sub(pattern3, replacement3, content, count=1)

with open("app/gantt/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied successfully")
