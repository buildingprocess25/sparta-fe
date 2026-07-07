const fs = require('fs');

const path = 'c:/alfamart/SPARTA/sparta-fe/app/surat-peringatan/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const returnRegex = /return \(\s*<div className="min-h-screen bg-slate-50 font-sans pb-12 relative">\s*<AppNavbar title="SURAT PERINGATAN" showBackButton backHref="\/dashboard" \/>\s*<main className="max-w-5xl mx-auto p-4 md:p-8 mt-4">[\s\S]*?<\/main>\s*<\/div>\s*\);\s*\}/;

const newReturn = `return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12 relative">
            <AppNavbar title="SURAT PERINGATAN" showBackButton backHref="/dashboard" />

            <main className="max-w-5xl mx-auto p-4 md:p-8 mt-4">
                {viewMode === "list" && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle className="w-6 h-6"/></div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Daftar Surat Peringatan</h2>
                                    <p className="text-sm text-slate-500">Daftar pengajuan dan riwayat Surat Peringatan.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <Button variant="outline" onClick={loadData} disabled={loading} className="gap-2 flex-1 md:flex-none">
                                    <RefreshCw className={\`h-4 w-4 \${loading ? "animate-spin" : ""}\`} />
                                    <span>Refresh</span>
                                </Button>
                                {userCanSubmit && (
                                    <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 flex-1 md:flex-none shadow-sm" onClick={() => {
                                        setReason("KETERLAMBATAN");
                                        setSelectedContractor("");
                                        setSelectedId(null);
                                        setNote("");
                                        setFile(null);
                                        setViewMode("form");
                                    }}>
                                        <Plus className="h-4 w-4" />
                                        Buat Peringatan Baru
                                    </Button>
                                )}
                            </div>
                        </div>

                        {message ? (
                            <div className={\`p-4 rounded-xl flex items-start gap-3 font-medium text-sm \${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}\`}>
                                {message.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                                <p>{message.text}</p>
                            </div>
                        ) : null}

                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card className="rounded-xl border-slate-200 shadow-sm">
                                <div className="p-4 border-b border-slate-100 bg-white rounded-t-xl flex items-center gap-2">
                                    <Clock3 className="h-5 w-5 text-amber-600" />
                                    <h2 className="font-bold text-slate-800">Menunggu Approval</h2>
                                </div>
                                <CardContent className="p-4 bg-slate-50/50">
                                    <div className="grid gap-3">
                                        {pendingActions.length === 0 ? <p className="text-sm font-semibold text-slate-500 text-center py-4">Tidak ada pengajuan pending.</p> : pendingActions.map((action) => (
                                            <div key={action.id} onClick={() => { setSelectedDetailAction(action); setViewMode("detail"); }} className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-slate-300">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">SP {action.sp_level} &middot; {action.nama_kontraktor || "-"}</p>
                                                        <p className="mt-1 text-xs font-semibold text-slate-500">{action.nomor_ulok || "-"} &middot; {SP_REASON_LABELS[action.alasan_sp ?? "KETERLAMBATAN"]}</p>
                                                    </div>
                                                    <Badge className="border-amber-200 bg-amber-50 text-amber-700 shadow-none">{statusLabel(action.status)}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl border-slate-200 shadow-sm">
                                <div className="p-4 border-b border-slate-100 bg-white rounded-t-xl flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    <h2 className="font-bold text-slate-800">Riwayat Surat Peringatan</h2>
                                </div>
                                <CardContent className="p-4 bg-slate-50/50">
                                    <div className="grid gap-3">
                                        {approvedActions.length === 0 ? <p className="text-sm font-semibold text-slate-500 text-center py-4">Riwayat SP belum ada.</p> : approvedActions.map((action) => (
                                            <div key={action.id} onClick={() => { setSelectedDetailAction(action); setViewMode("detail"); }} className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-slate-300">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">SP {action.sp_level} &middot; {action.nama_kontraktor || "-"}</p>
                                                        <p className="mt-1 text-xs font-semibold text-slate-500">{action.nomor_ulok || "-"} &middot; {SP_REASON_LABELS[action.alasan_sp ?? "KETERLAMBATAN"]}</p>
                                                    </div>
                                                    <Badge className={action.status === "REJECTED_BY_MANAGER" ? "border-red-200 bg-red-50 text-red-700 shadow-none" : "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none"}>{statusLabel(action.status)}</Badge>
                                                </div>
                                                {action.expires_at ? <p className="mt-2 text-[10px] font-bold text-slate-400">Expired: {new Date(action.expires_at).toLocaleDateString("id-ID")}</p> : null}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {viewMode === "form" && (
                    <div className="space-y-4">
                        <Button variant="ghost" onClick={() => setViewMode("list")} className="mb-2 text-slate-600 hover:text-slate-900">
                            <ArrowLeft className="h-4 w-4 mr-2"/>
                            Kembali ke Daftar
                        </Button>

                        <Card className="shadow-sm border-slate-200 relative z-10">
                            <div className="p-6 border-b border-slate-100 bg-white rounded-t-xl flex items-center gap-3">
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle className="w-6 h-6"/></div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Pengajuan Surat Peringatan</h2>
                                    <p className="text-sm text-slate-500">Pilih kandidat dan alasan untuk mengajukan Surat Peringatan.</p>
                                </div>
                            </div>
                            
                            <CardContent className="p-6 md:p-8 bg-slate-50/50">
                                {message ? (
                                    <div className={\`mb-6 p-4 rounded-xl flex items-start gap-3 font-medium text-sm \${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}\`}>
                                        {message.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                                        <p>{message.text}</p>
                                    </div>
                                ) : null}

                                <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
                                    <h3 className="font-bold text-slate-700 border-b pb-2 mb-4">1. Data Kandidat &amp; Alasan SP</h3>
                                    
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div>
                                            <Label className="text-sm font-bold text-slate-700 mb-2 block">Pilih Kontraktor *</Label>
                                            <Select value={selectedContractor} onValueChange={(val) => { setSelectedContractor(val); setSelectedId(null); }}>
                                                <SelectTrigger className="w-full p-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 h-11"><SelectValue placeholder="Pilih kontraktor..." /></SelectTrigger>
                                                <SelectContent>
                                                    {availableContractors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-bold text-slate-700 mb-2 block">Alasan Surat Peringatan *</Label>
                                            <Select value={reason} onValueChange={(value) => setReason(value as SpReason)}>
                                                <SelectTrigger className="w-full p-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 h-11"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(SP_REASON_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {reason !== "MANIPULASI" && (
                                        <div className="mt-6">
                                            <Label className="text-sm font-bold text-slate-700 mb-2 block">Pilih Kandidat (ULOK) *</Label>
                                            <Popover open={openDropdown} onOpenChange={setOpenDropdown}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full justify-between h-auto min-h-11 py-2.5 px-3.5 text-left font-normal border-slate-300 hover:bg-slate-50" disabled={!selectedContractor}>
                                                        {selected ? (
                                                            <div className="flex flex-col gap-0.5 items-start">
                                                                <span className="font-bold text-slate-950 text-sm line-clamp-1">{selected.nomor_ulok || "-"} &middot; {selected.nama_toko || "-"}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-500">{!selectedContractor ? "Pilih kontraktor terlebih dahulu..." : "Klik untuk memilih kandidat..."}</span>
                                                        )}
                                                        <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl" align="start">
                                                    <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5 bg-slate-50/50 rounded-t-xl">
                                                        <Search className="h-4 w-4 text-slate-400 shrink-0" />
                                                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari ULOK, toko" className="border-0 px-0 shadow-none focus-visible:ring-0 h-8 bg-transparent" />
                                                    </div>
                                                    <div className="max-h-72 overflow-y-auto p-1.5 grid gap-1">
                                                        {loading ? (
                                                            <div className="p-4 text-center text-sm font-medium text-slate-500">Memuat data...</div>
                                                        ) : filteredCandidates.length === 0 ? (
                                                            <div className="p-4 text-center text-sm font-medium text-slate-500">
                                                                {reason === "KETERLAMBATAN" ? "Tidak ada kandidat yang terlambat saat ini untuk kontraktor ini." : "Tidak ada kandidat ditemukan untuk kontraktor ini."}
                                                            </div>
                                                        ) : (
                                                            filteredCandidates.map((candidate) => (
                                                                <button
                                                                    key={candidate.id_toko}
                                                                    type="button"
                                                                    onClick={() => { setSelectedId(candidate.id_toko); setOpenDropdown(false); }}
                                                                    className={\`w-full flex flex-col gap-1 rounded-md p-2.5 text-left transition hover:bg-slate-100 \${selectedId === candidate.id_toko ? "bg-red-50 border border-red-200 text-red-950 hover:bg-red-100" : "text-slate-700"}\`}
                                                                >
                                                                    <div className="flex justify-between items-start gap-2 w-full">
                                                                        <span className="font-bold text-sm text-slate-950 line-clamp-1">{candidate.nomor_ulok} &middot; {candidate.nama_toko}</span>
                                                                        <div className="flex gap-1 shrink-0">
                                                                            {candidate.hari_denda > 0 ? <Badge className="border-red-200 bg-red-50 text-red-700 text-[10px] px-1.5 py-0">Late {candidate.hari_denda}d</Badge> : null}
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-400">
                                                                        <span>{candidate.cabang || "-"}</span>
                                                                        <span>{candidate.lingkup_pekerjaan || "-"}</span>
                                                                    </div>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    )}
                                </div>

                                {selectedContractor && (reason === "MANIPULASI" || selected) ? (
                                    <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
                                        <h3 className="font-bold text-slate-700 border-b pb-2 mb-4">2. Detail SP &amp; Lampiran</h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700">Tingkat SP</Label>
                                                {(() => {
                                                    const existingLevels = new Set(
                                                        actions
                                                            .filter((a) => a.action_type === "SP" &&
                                                                (reason === "MANIPULASI"
                                                                    ? normalize(a.nama_kontraktor) === normalize(selectedContractor)
                                                                    : a.id_toko === selected?.id_toko) &&
                                                                ["APPROVED", "SENT_TO_CONTRACTOR", "VIEWED_BY_CONTRACTOR", "ACKNOWLEDGED_BY_CONTRACTOR"].includes(a.status))
                                                            .map((a) => a.sp_level)
                                                    );
                                                    const allLevels = [1, 2, 3] as const;
                                                    return (
                                                        <Select value={String(spLevel)} onValueChange={(v) => setSpLevel(Number(v) as 1 | 2 | 3)}>
                                                            <SelectTrigger className="w-full p-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 h-11">
                                                                <SelectValue placeholder="Pilih tingkat SP..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {allLevels.map((lvl) => (
                                                                    <SelectItem key={lvl} value={String(lvl)} disabled={existingLevels.has(lvl)}>
                                                                        Surat Peringatan Ke-{lvl}{existingLevels.has(lvl) ? " (sudah ada)" : ""}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    );
                                                })()}
                                            </div>
                                            {reason === "KETERLAMBATAN" && selected ? (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-bold text-slate-700">Total Denda Sementara</Label>
                                                    <div className="flex h-11 items-center rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-bold text-red-700">
                                                        {formatRupiah(parseCurrency(selected.nilai_denda))}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700">Catatan Tambahan</Label>
                                                <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Masukkan instruksi tindak lanjut atau catatan tambahan..." className="min-h-[120px] resize-none border-slate-300 focus:ring-red-500 rounded-lg p-3" />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700">Upload Lampiran Pendukung *</Label>
                                                <label className="flex h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-3 text-center transition hover:border-red-400 hover:bg-red-50/50 group">
                                                    <Upload className="mb-2 h-6 w-6 text-slate-400 group-hover:text-red-500 transition-colors" />
                                                    <span className="text-sm font-semibold text-slate-600 group-hover:text-red-600">{file ? file.name : "Klik atau Drop file di sini"}</span>
                                                    <span className="text-xs text-slate-400 mt-1">Maks. 5MB (PDF/JPG/PNG)</span>
                                                    <input type="file" className="hidden" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {selectedContractor && (reason === "MANIPULASI" || selected) ? (
                                    <div className="pt-2">
                                        <Button className="w-full h-14 text-lg font-bold shadow-lg transition-all bg-red-600 hover:bg-red-700 text-white rounded-xl" onClick={submitSp} disabled={!userCanSubmit || submitting || (reason !== "MANIPULASI" && selected?.has_pending_approval)}>
                                            {submitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <FileText className="mr-2 h-6 w-6" />}
                                            {reason !== "MANIPULASI" && selected?.has_pending_approval ? "SP Sedang Dalam Proses Approval" : "Ajukan Surat Peringatan"}
                                        </Button>
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {viewMode === "detail" && selectedDetailAction && (
                    <div className="space-y-4">
                        <Button variant="ghost" onClick={() => { setViewMode("list"); setSelectedDetailAction(null); }} className="mb-2 text-slate-600 hover:text-slate-900">
                            <ArrowLeft className="h-4 w-4 mr-2"/>
                            Kembali ke Daftar
                        </Button>

                        <Card className="shadow-sm border-slate-200">
                            <div className="p-6 border-b border-slate-100 bg-white rounded-t-xl">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Detail Surat Peringatan</h2>
                                        <p className="text-sm text-slate-500">Informasi lengkap pengajuan SP dan persetujuan.</p>
                                    </div>
                                    <Badge className={selectedDetailAction.status === "REJECTED_BY_MANAGER" ? "border-red-200 bg-red-50 text-red-700 shadow-none px-3 py-1" : selectedDetailAction.status === "WAITING_MANAGER" ? "border-amber-200 bg-amber-50 text-amber-700 shadow-none px-3 py-1" : "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none px-3 py-1"}>
                                        {statusLabel(selectedDetailAction.status)}
                                    </Badge>
                                </div>
                            </div>

                            <CardContent className="p-6 md:p-8 bg-slate-50/50 space-y-6">
                                {message ? (
                                    <div className={\`p-4 rounded-xl flex items-start gap-3 font-medium text-sm \${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}\`}>
                                        {message.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                                        <p>{message.text}</p>
                                    </div>
                                ) : null}

                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Kontraktor</Label>
                                        <p className="font-medium text-slate-800">{selectedDetailAction.nama_kontraktor || "-"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Kandidat (ULOK)</Label>
                                        <p className="font-medium text-slate-800">{selectedDetailAction.nomor_ulok ? \`\${selectedDetailAction.nomor_ulok} - \${selectedDetailAction.nama_toko}\` : "-"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Alasan SP</Label>
                                        <p className="font-medium text-slate-800">{SP_REASON_LABELS[selectedDetailAction.alasan_sp ?? "KETERLAMBATAN"]}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Tingkat SP</Label>
                                        <p className="font-medium text-slate-800">SP {selectedDetailAction.sp_level}</p>
                                    </div>
                                    {selectedDetailAction.catatan && (
                                        <div className="md:col-span-2 mt-2">
                                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Catatan Tambahan</Label>
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">{selectedDetailAction.catatan}</div>
                                        </div>
                                    )}
                                </div>

                                {selectedDetailAction.status === "WAITING_MANAGER" && userCanApprove && (
                                    <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm mt-6">
                                        <h3 className="font-bold text-amber-700 border-b border-amber-100 pb-2 mb-4 flex items-center gap-2">
                                            <Clock3 className="h-5 w-5" /> Tindakan Approval
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-sm font-bold text-slate-700 mb-2 block">Alasan / Catatan Penolakan (Wajib jika menolak)</Label>
                                                <Textarea value={rejectNote[selectedDetailAction.id] ?? ""} onChange={(event) => setRejectNote((prev) => ({ ...prev, [selectedDetailAction.id]: event.target.value }))} placeholder="Isi alasan penolakan di sini..." className="min-h-24 text-sm resize-none rounded-lg" />
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-12 shadow-sm" onClick={() => handleApprove(selectedDetailAction.id)} disabled={submitting}>
                                                    <CheckCircle2 className="mr-2 h-5 w-5" /> Setujui Pengajuan
                                                </Button>
                                                <Button variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 h-12 shadow-sm" onClick={() => handleReject(selectedDetailAction.id)} disabled={submitting}>
                                                    <XCircle className="mr-2 h-5 w-5" /> Tolak Pengajuan
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedDetailAction.status === "REJECTED_BY_MANAGER" && userCanSubmit && (
                                    <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-red-700">Surat Peringatan Ditolak</h3>
                                            <p className="text-sm text-red-600 mt-1">Anda dapat memperbaiki dan mengajukan ulang SP tingkat ini dengan form baru.</p>
                                        </div>
                                        <Button className="bg-red-600 hover:bg-red-700 text-white shadow-sm whitespace-nowrap" onClick={() => {
                                            if (selectedDetailAction.alasan_sp) {
                                                setReason(selectedDetailAction.alasan_sp);
                                            }
                                            setSelectedContractor(selectedDetailAction.nama_kontraktor || "");
                                            if (selectedDetailAction.id_toko) {
                                                setSelectedId(selectedDetailAction.id_toko);
                                            }
                                            setSpLevel(selectedDetailAction.sp_level as 1|2|3);
                                            setNote(selectedDetailAction.catatan || "");
                                            setViewMode("form");
                                        }}>
                                            <AlertTriangle className="h-4 w-4 mr-2" />
                                            Revisi / Ajukan Ulang
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}`;

content = content.replace(returnRegex, newReturn);
fs.writeFileSync(path, content);
