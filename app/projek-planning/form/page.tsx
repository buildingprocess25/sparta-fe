"use client"
import React, { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Send, Loader2, ChevronDown, Building2, Droplets, Wind, Zap, ClipboardList, FileText, Camera, Store, PlusCircle, Search, MapPin, CheckCircle2, FileImage, CheckCircle, Eye, AlertTriangle } from "lucide-react";
import { fetchTokoList, submitProjekPlanning, resubmitProjekPlanning, fetchProjekPlanningDetail, fetchRABList, fetchRABDetail } from "@/lib/api";
import { getPpRoles, BRANCH_TO_ULOK, canAccessProjectPlanningByCabang, canViewAllBranches } from "@/lib/constants";
import { PHOTO_POINTS, FLOOR_IMAGES, PAGE_LABELS, ALL_POINTS } from "@/app/ftdokumen/photoPoints";

type TokoOption = { id: number; nomor_ulok: string; nama_toko: string; cabang: string; proyek: string; lingkup_pekerjaan: string; kode_toko: string };

const JENIS_OPTIONS = ["DRIVE THRU", "BEAN SPOT", "FASADE", "DARK STORE", "LAINNYA"];
const DARK_STORE_OPTION = "DARK STORE";
const BEANSPOT_TIPE_OPTIONS = ["RTD ONLY", "Medium", "Advance"];

type ProjectFileState = File[];

const MAX_FILES_PER_FIELD = 2;

const defaultFasilitas = () => [
  { jenis_fasilitas: "AIR_BERSIH", is_tersedia: false, keterangan: "" },
  { jenis_fasilitas: "DRAINASE", is_tersedia: false, keterangan: "" },
  { jenis_fasilitas: "AC", is_tersedia: false, keterangan: "" },
  { jenis_fasilitas: "LISTRIK", is_tersedia: false, keterangan: "" },
  { jenis_fasilitas: "LAINNYA", nama_fasilitas_lainnya: "", is_tersedia: false, keterangan: "" }
];

const normalizeFasilitas = (items: any[] = []) => {
  const base = defaultFasilitas();
  items.forEach(item => {
    const idx = base.findIndex(f => f.jenis_fasilitas === item.jenis_fasilitas);
    if (idx >= 0 && item.jenis_fasilitas !== "LAINNYA") base[idx] = { ...base[idx], ...item };
    else if (idx >= 0 && item.jenis_fasilitas === "LAINNYA" && !(base[idx] as any).nama_fasilitas_lainnya) base[idx] = { ...base[idx], ...item };
    else base.push(item);
  });
  return base;
};

const normalizeRevisionFasilitas = (items: any[] = []) =>
  items.map(item => ({
    jenis_fasilitas: item.jenis_fasilitas || "",
    nama_fasilitas_lainnya: item.nama_fasilitas_lainnya || "",
    is_tersedia: !!item.is_tersedia,
    keterangan: item.keterangan || "",
  }));

const normalizeRevisionTexts = (items: string[] = []) => items.map(item => item.trim());

const formatDecimalInput = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "";
  return Number(value.toFixed(2)).toString();
};

const parseRupiahInput = (value: string) => {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : undefined;
};

const formatRupiahInput = (value: string | number | null | undefined) => {
  const number = typeof value === "number" ? value : parseRupiahInput(String(value ?? ""));
  if (!number) return "";
  return `Rp ${number.toLocaleString("id-ID")}`;
};

function FormProjekPlanningInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resubmitId = searchParams.get("resubmit");
  const [submitting, setSubmitting] = useState(false);
  const [fileFpd, setFileFpd] = useState<ProjectFileState>([]);
  const [fileGambarKerjaMe, setFileGambarKerjaMe] = useState<ProjectFileState>([]);
  const [fileRabSipil, setFileRabSipil] = useState<ProjectFileState>([]);
  const [fileRabMe, setFileRabMe] = useState<ProjectFileState>([]);
  const [fileGambarKompetitor, setFileGambarKompetitor] = useState<ProjectFileState>([]);
  const [fileSiteplan, setFileSiteplan] = useState<ProjectFileState>([]);
  const [fileBaTidakSesuaiStandar, setFileBaTidakSesuaiStandar] = useState<ProjectFileState>([]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ title: "", desc: "", type: "" });
  const [tokoList, setTokoList] = useState<TokoOption[]>([]);
  const [tokoSearch, setTokoSearch] = useState("");
  const [showToko, setShowToko] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Manual ULOK state
  const [isManualUlok, setIsManualUlok] = useState(false);
  const [manualCabang, setManualCabang] = useState(""); // kode ULOK prefix (OZ01) — for display only
  const [manualCabangNama, setManualCabangNama] = useState(""); // nama cabang lengkap (KLATEN) — for DB
  const [manualTanggal, setManualTanggal] = useState("");
  const [manualUrutan, setManualUrutan] = useState("");
  const [manualNamaToko, setManualNamaToko] = useState("");
  const [manualAlamat, setManualAlamat] = useState("");
  const [manualKodeToko, setManualKodeToko] = useState("");

  // Form state
  const [ketentuan, setKetentuan] = useState<string[]>([""]);
  const [catatanDesign, setCatatanDesign] = useState<string[]>([""]);
  const [fasilitas, setFasilitas] = useState<{ jenis_fasilitas: string; nama_fasilitas_lainnya?: string; is_tersedia: boolean; keterangan?: string }[]>(defaultFasilitas());

  // New form feature states
  const [jenisSelected, setJenisSelected] = useState<string[]>([]);
  const [isHeadToHead, setIsHeadToHead] = useState(false);
  const [isSeatingArea, setIsSeatingArea] = useState(false);
  const [isDarkStore, setIsDarkStore] = useState(false);
  const [beanspotTipe, setBeanspotTipe] = useState("");
  const isDarkStoreDesign = jenisSelected.includes(DARK_STORE_OPTION);

  const [isRabApproved, setIsRabApproved] = useState<boolean | null>(null);

  useEffect(() => {
    let finalUlok = "";
    if (!isManualUlok) {
       if (manualCabang && manualTanggal && manualUrutan) finalUlok = `${manualCabang}-${manualTanggal}-${manualUrutan}-R`;
    } else {
       if (manualCabang && manualTanggal && manualUrutan) finalUlok = `${manualCabang}-${manualTanggal}-${manualUrutan}`;
    }

    if (finalUlok.length >= 8) {
       const timer = setTimeout(() => {
         fetchRABList({ nomor_ulok: finalUlok, status: "Disetujui" }, { suppressGlobalError: true })
           .then(async res => {
             const rows = res.data || [];
             const sipilRab = rows.find((r: any) => String(r.toko?.lingkup_pekerjaan || r.lingkup_pekerjaan || "").toUpperCase().includes("SIPIL"));
             const meRab = rows.find((r: any) => String(r.toko?.lingkup_pekerjaan || r.lingkup_pekerjaan || "").toUpperCase().includes("ME"));
             setIsRabApproved(!!sipilRab && !!meRab);

             if (sipilRab?.id) {
               try {
                 const detail = await fetchRABDetail(Number(sipilRab.id));
                 const rab = detail.data.rab as any;
                 setF(prev => ({
                   ...prev,
                   luas_bangunan: rab?.luas_bangunan != null ? String(rab.luas_bangunan) : prev.luas_bangunan,
                   luas_area_terbuka: rab?.luas_area_terbuka != null ? String(rab.luas_area_terbuka) : prev.luas_area_terbuka,
                   luas_gudang: rab?.luas_gudang != null ? String(rab.luas_gudang) : prev.luas_gudang,
                   luas_area_parkir: rab?.luas_area_parkir != null ? String(rab.luas_area_parkir) : prev.luas_area_parkir,
                   luas_area_sales: rab?.luas_area_sales != null ? String(rab.luas_area_sales) : prev.luas_area_sales,
                 }));
               } catch {
                 // Detail RAB hanya dipakai untuk auto-fill luasan; submit tahap 1 tidak diblokir.
               }
             }
           })
           .catch(() => setIsRabApproved(false));
       }, 500);
       return () => clearTimeout(timer);
    } else {
       setIsRabApproved(null);
    }
  }, [isManualUlok, manualCabang, manualTanggal, manualUrutan]);

  useEffect(() => {
    if (!isDarkStoreDesign) return;
    setIsHeadToHead(false);
    setIsSeatingArea(false);
    setIsDarkStore(false);
  }, [isDarkStoreDesign]);

  // Foto State
  const [fotoFiles, setFotoFiles] = useState<{ [key: number]: File | null }>({});
  const [fotoExistingUrls, setFotoExistingUrls] = useState<{ [key: number]: string }>({});
  const [activeFotoTab, setActiveFotoTab] = useState<number>(1);

  // Camera modal state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraTargetId, setCameraTargetId] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const openCamera = useCallback(async (pointId: number) => {
    setCameraTargetId(pointId);
    setCameraError("");
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setCameraError("Kamera tidak bisa diakses. Pastikan izin kamera sudah diberikan.");
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
    setCameraTargetId(null);
    setCameraError("");
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || cameraTargetId === null) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `foto_${cameraTargetId}_${Date.now()}.jpg`, { type: "image/jpeg" });
      setFotoFiles(prev => ({ ...prev, [cameraTargetId]: file }));
      closeCamera();
    }, "image/jpeg", 0.85);
  }, [cameraTargetId, closeCamera]);

  const [f, setF] = useState({
    id_toko: 0, nomor_ulok: "", lingkup_pekerjaan: "", jenis_proyek: "",
    nama_pengaju: "", nama_lokasi: "", jenis_pengajuan: "", jenis_pengajuan_lainnya: "",
    estimasi_biaya: "", keterangan: "", link_fpd: "",
    link_siteplan: "",
    luas_bangunan: "", luas_area_terbuka: "", luas_area_terbangun: "",
    luas_gudang: "", luas_area_parkir: "", luas_area_sales: "",
    pxl_bangunan: "", pxl_area_parkir: "",
    p_bangunan: "", l_bangunan: "", p_area_parkir: "", l_area_parkir: "",
    jumlah_ac: "", pk_ac: "", listrik_va: "", listrik_phase: "",
    sumber_air_bersih: "", drainase_air_kotor: "",
    link_gambar_kerja: "",
    link_gambar_kompetitor: "",
    akhir_masa_sewa: "",
    spd: "",
    link_ba_tidak_sesuai_standar: "",
    jarak_head_to_head: "",
    link_google_maps: "",
    is_ruko: false, jumlah_lantai: "",
  });
  const [originalF, setOriginalF] = useState<any>(null);
  const [originalRevisionSnapshot, setOriginalRevisionSnapshot] = useState<string>("");

  const set = (key: string, val: any) => setF(p => ({ ...p, [key]: val }));

  useEffect(() => {
    const luasBangunan = Number(f.luas_bangunan) || 0;
    const luasAreaTerbuka = Number(f.luas_area_terbuka) || 0;
    const next = formatDecimalInput(luasBangunan + (luasAreaTerbuka / 2));
    setF(prev => prev.luas_area_terbangun === next ? prev : { ...prev, luas_area_terbangun: next });
  }, [f.luas_bangunan, f.luas_area_terbuka]);

  const getRevisionSnapshot = (base: any = f, extras?: {
    manualCabang?: string;
    manualTanggal?: string;
    manualUrutan?: string;
    manualNamaToko?: string;
    manualAlamat?: string;
    manualKodeToko?: string;
    jenisSelected?: string[];
    beanspotTipe?: string;
    isHeadToHead?: boolean;
    isSeatingArea?: boolean;
    isDarkStore?: boolean;
    fasilitas?: any[];
    ketentuan?: string[];
    catatanDesign?: string[];
  }) => JSON.stringify({
    ...base,
    manualCabang: extras?.manualCabang ?? manualCabang,
    manualTanggal: extras?.manualTanggal ?? manualTanggal,
    manualUrutan: extras?.manualUrutan ?? manualUrutan,
    manualNamaToko: extras?.manualNamaToko ?? manualNamaToko,
    manualAlamat: extras?.manualAlamat ?? manualAlamat,
    manualKodeToko: extras?.manualKodeToko ?? manualKodeToko,
    jenisSelected: [...(extras?.jenisSelected ?? jenisSelected)].sort(),
    beanspotTipe: extras?.beanspotTipe ?? beanspotTipe,
    isHeadToHead: extras?.isHeadToHead ?? isHeadToHead,
    isSeatingArea: extras?.isSeatingArea ?? isSeatingArea,
    isDarkStore: extras?.isDarkStore ?? isDarkStore,
    fasilitas: normalizeRevisionFasilitas(extras?.fasilitas ?? fasilitas),
    ketentuan: normalizeRevisionTexts(extras?.ketentuan ?? ketentuan),
    catatanDesign: normalizeRevisionTexts(extras?.catatanDesign ?? catatanDesign),
  });

  const handleMultiFileChange = (setter: React.Dispatch<React.SetStateAction<ProjectFileState>>, clearLink: () => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const files = selectedFiles.slice(0, MAX_FILES_PER_FIELD);
    if (selectedFiles.length > MAX_FILES_PER_FIELD) {
      setAlertMsg({ title: "Maksimal 2 File", desc: "Setiap kolom upload hanya bisa berisi maksimal 2 file. File selebihnya tidak ikut dipilih.", type: "error" });
      setAlertOpen(true);
    }
    setter(files);
    if (files.length > 0) clearLink();
  };

  useEffect(() => {
    const email = sessionStorage.getItem("loggedInUserEmail") || "";
    if (!email) { router.push("/auth"); return; }
    const cabang = sessionStorage.getItem("loggedInUserCabang") || "";
    const role = sessionStorage.getItem("userRole") || "";
    if (!canAccessProjectPlanningByCabang(cabang) || canViewAllBranches(role)) { router.replace("/dashboard"); return; }
    setUserEmail(email);
    const nama = sessionStorage.getItem("nama_lengkap") || "";
    set("nama_pengaju", nama);

    fetchTokoList().then(r => {
      let data = r.data || [];
      const role = sessionStorage.getItem("userRole") || "";
      const { isPP, isPPMgr } = getPpRoles(role, email);

      // Jika BUKAN PP / PP Manager (artinya Coordinator atau BM), WAJIB difilter ke cabangnya sendiri
      if (!isPP && !isPPMgr && cabang) {
        // Cari pemetaan Ulok (Kode Cabang vs Nama Cabang)
        const ulokEntry = Object.entries(BRANCH_TO_ULOK).find(([nama, kode]) =>
          nama === cabang.toUpperCase() || kode === cabang.toUpperCase()
        );

        const allowedCabang = [cabang.toUpperCase()];
        if (ulokEntry) {
          allowedCabang.push(ulokEntry[0]); // ex: KLATEN
          allowedCabang.push(ulokEntry[1]); // ex: OZ01
          // kode for ULOK display, nama for DB storage
          // Jangan override cabang saat mode resubmit — cabang harus dari data proyek, bukan dari session user
          if (!resubmitId) {
            setManualCabang(ulokEntry[1] || ulokEntry[0]);
            setManualCabangNama(ulokEntry[0] || cabang.toUpperCase());
          }
        } else {
          if (!resubmitId) {
            setManualCabang(cabang.toUpperCase());
            setManualCabangNama(cabang.toUpperCase());
          }
        }

        data = data.filter(t => t.cabang && allowedCabang.includes(t.cabang.toUpperCase()));
      }
      setTokoList(data);
    }).catch(console.error);

    if (resubmitId) {
      fetchProjekPlanningDetail(Number(resubmitId)).then(r => {
        if (r.data && r.data.projek) {
          const p = r.data.projek;
          const merged = { ...f, ...p, spd: formatRupiahInput((p as any).spd) };
          setF(merged as any);
          setOriginalF(merged);
          const ulokParts = p.nomor_ulok ? p.nomor_ulok.split("-") : [];
          
          if (p.nomor_ulok) {
            if (ulokParts.length >= 3) {
              setManualCabang(ulokParts[0]);
              setManualTanggal(ulokParts[1]);
              setManualUrutan(ulokParts[2]);
              
              if (p.nomor_ulok.endsWith("-R")) {
                setIsManualUlok(false); // Renovasi
              } else {
                setIsManualUlok(true); // Reguler
              }
            }
          }
          setManualNamaToko(p.nama_toko || "");
          setManualKodeToko(p.kode_toko || "");
          setManualAlamat(p.alamat_toko || "");
          
          setTokoSearch(`${p.nomor_ulok} — ${p.nama_toko || p.nama_lokasi}`);

          const nextKetentuan = p.ketentuan && p.ketentuan.length > 0 ? p.ketentuan.map((k: any) => k.isi_ketentuan) : [""];
          const nextCatatan = p.catatan_design && p.catatan_design.length > 0 ? p.catatan_design.map((c: any) => c.isi_catatan) : [""];
          const nextFasilitas = normalizeFasilitas(p.fasilitas || []);
          setKetentuan(nextKetentuan);
          setCatatanDesign(nextCatatan);
          setFasilitas(nextFasilitas);

          // Map new fields
          let nextJenisSelected: string[] = [];
          if (p.jenis_pengajuan) {
            nextJenisSelected = p.jenis_pengajuan.split(",").map((j: string) => j.trim()).filter(Boolean);
            setJenisSelected(nextJenisSelected);
          }
          if (p.is_head_to_head !== undefined) setIsHeadToHead(!!p.is_head_to_head);
          if (p.is_seating_area !== undefined) setIsSeatingArea(!!p.is_seating_area);
          if (p.is_dark_store !== undefined) setIsDarkStore(!!p.is_dark_store);
          const nextBeanspotTipe = p.beanspot_tipe === "Basic" ? "RTD ONLY" : (p.beanspot_tipe || "");
          if (nextBeanspotTipe) setBeanspotTipe(nextBeanspotTipe);
          const resolvedCabangNama = p.cabang || (() => {
            const entry = Object.entries(BRANCH_TO_ULOK).find(([, kode]) => kode === ulokParts[0]);
            return entry ? entry[0] : ulokParts[0];
          })();
          setOriginalRevisionSnapshot(getRevisionSnapshot(merged, {
            manualCabang: ulokParts[0] || manualCabang,
            manualTanggal: ulokParts[1] || "",
            manualUrutan: ulokParts[2] || "",
            manualNamaToko: p.nama_toko || "",
            manualAlamat: p.alamat_toko || "",
            manualKodeToko: p.kode_toko || "",
            jenisSelected: nextJenisSelected,
            beanspotTipe: nextBeanspotTipe,
            isHeadToHead: !!p.is_head_to_head,
            isSeatingArea: !!p.is_seating_area,
            isDarkStore: !!p.is_dark_store,
            fasilitas: nextFasilitas,
            ketentuan: nextKetentuan,
            catatanDesign: nextCatatan,
          }));
          // Pastikan manualCabangNama sudah sesuai data proyek (override dari fetchTokoList yang mungkin belum selesai)
          setManualCabangNama(resolvedCabangNama);

          if (p.foto_items && p.foto_items.length > 0) {
            const urls: { [key: number]: string } = {};
            p.foto_items.forEach((foto: any) => {
              urls[foto.item_index] = foto.link_foto;
            });
            setFotoExistingUrls(urls);
          }
        }
      });
    }
  }, [router, resubmitId]);

  const selectToko = (t: TokoOption) => {
    setF(p => ({ ...p, id_toko: t.id, nomor_ulok: t.nomor_ulok, nama_lokasi: t.nama_toko, lingkup_pekerjaan: t.lingkup_pekerjaan, jenis_proyek: t.proyek }));
    setTokoSearch(`${t.nomor_ulok} — ${t.nama_toko}`);
    setShowToko(false);
    const parts = t.nomor_ulok.split("-");
    if (parts.length >= 3) {
      setManualCabang(parts[0]);
      setManualTanggal(parts[1]);
      setManualUrutan(parts[2]);
    }
  };

  const filteredToko = tokoList.filter(t =>
    `${t.nomor_ulok} ${t.nama_toko} ${t.cabang}`.toLowerCase().includes(tokoSearch.toLowerCase())
  ).slice(0, 30);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCabang || !manualTanggal || !manualUrutan) { setAlertMsg({ title: "Error", desc: "Harap lengkapi semua field Nomor ULOK (Kode Cabang, Tanggal, dan Urutan)", type: "error" }); setAlertOpen(true); return; }
    if (!isManualUlok && !f.jenis_proyek) { setAlertMsg({ title: "Error", desc: "Pilih proyek", type: "error" }); setAlertOpen(true); return; }
    if (jenisSelected.length === 0) { setAlertMsg({ title: "Error", desc: "Pilih minimal satu jenis pengajuan", type: "error" }); setAlertOpen(true); return; }
    if (resubmitId && originalF) {
      // Cek apakah ada perubahan
      const hasChanges =
        getRevisionSnapshot() !== originalRevisionSnapshot ||
        fileFpd.length > 0 ||
        fileGambarKerjaMe.length > 0 ||
        fileGambarKompetitor.length > 0 ||
        fileSiteplan.length > 0 ||
        fileBaTidakSesuaiStandar.length > 0 ||
        Object.keys(fotoFiles).length > 0;
      if (!hasChanges) {
        setAlertMsg({ title: "Peringatan", desc: "Silakan ubah minimal satu data / isi form sebelum melakukan resubmit.", type: "error" });
        setAlertOpen(true);
        return;
      }
    }
    setSubmitting(true);
    try {
      let finalIdToko = 0;
      let finalCabang = manualCabangNama || manualCabang;
      let finalNamaToko = manualNamaToko;
      let finalAlamat = manualAlamat;
      let finalUlok = "";
      let finalJenisProyek = "";

      if (!isManualUlok) { // Renovasi
        finalUlok = `${manualCabang}-${manualTanggal}-${manualUrutan}-R`;
        finalJenisProyek = f.jenis_proyek;
      } else { // Reguler
        finalUlok = `${manualCabang}-${manualTanggal}-${manualUrutan}`;
        finalJenisProyek = "Reguler";
      }

      const {
        jumlah_ac,
        pk_ac,
        listrik_va,
        listrik_phase,
        sumber_air_bersih,
        drainase_air_kotor,
        spd,
        ...stageOneForm
      } = f;

        const payload = {
        ...stageOneForm,
        id_toko: finalIdToko,
        nomor_ulok: finalUlok,
        cabang: finalCabang,
        kode_toko: manualKodeToko || manualUrutan,
        nama_toko: finalNamaToko,
        alamat_toko: finalAlamat,
        jenis_proyek: finalJenisProyek,
        email_pembuat: userEmail,
        estimasi_biaya: f.estimasi_biaya ? Number(f.estimasi_biaya) : undefined,
        is_ruko: f.is_ruko,
        jumlah_lantai: f.jumlah_lantai ? Number(f.jumlah_lantai) : undefined,
        // Multi-select jenis: join with comma
        jenis_pengajuan: jenisSelected.join(","),
        akhir_masa_sewa: !isManualUlok ? (f as any).akhir_masa_sewa || undefined : undefined,
        spd: !isManualUlok ? parseRupiahInput(String((f as any).spd || "")) : undefined,
        link_ba_tidak_sesuai_standar: !isManualUlok ? (f as any).link_ba_tidak_sesuai_standar : undefined,
        // New fields
        is_head_to_head: isDarkStoreDesign ? false : isHeadToHead,
        is_seating_area: isDarkStoreDesign ? false : isSeatingArea,
        is_dark_store: isDarkStoreDesign ? false : isDarkStore,
        jarak_head_to_head: isDarkStoreDesign || !isHeadToHead || !(f as any).jarak_head_to_head ? undefined : Number((f as any).jarak_head_to_head),
        beanspot_tipe: jenisSelected.includes("BEAN SPOT") ? beanspotTipe : "",
        ketentuan: JSON.stringify(ketentuan.filter(k => k.trim() !== "")),
        catatan_design: JSON.stringify(catatanDesign.filter(c => c.trim() !== "")),
      };

      // Bersihkan fotoFiles dari item yang null
      const validFotoFiles: { [key: number]: File } = {};
      Object.entries(fotoFiles).forEach(([key, file]) => {
        if (file) validFotoFiles[Number(key)] = file;
      });

      let res;
      if (resubmitId) {
        res = await resubmitProjekPlanning(Number(resubmitId), payload, fileFpd, fileGambarKerjaMe, fileGambarKompetitor, fileSiteplan, fileBaTidakSesuaiStandar, validFotoFiles);
      } else {
        res = await submitProjekPlanning(payload, fileFpd, fileGambarKerjaMe, fileGambarKompetitor, fileSiteplan, fileBaTidakSesuaiStandar, validFotoFiles);
      }
      const skipBmApproval = ["BOGOR", "BATAM"].includes(finalCabang.toUpperCase());
      setAlertMsg({
        title: "Berhasil!",
        desc: skipBmApproval
          ? "FPD berhasil disimpan. Menunggu approval PP Specialist tahap 1."
          : "FPD berhasil disimpan. Menunggu approval B&M Manager.",
        type: "success"
      });
      setAlertOpen(true);
    } catch (err: any) {
      setAlertMsg({ title: "Gagal", desc: err.message || "Terjadi kesalahan", type: "error" });
      setAlertOpen(true);
    }
    setSubmitting(false);
  };

  const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
      <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">{icon}</div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <AppNavbar title="Form Permintaan Desain (FPD)" showBackButton backHref="/projek-planning" />
      <main className="max-w-5xl mx-auto p-4 md:p-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-red-600" /> Form Permintaan Desain (FPD)
            </CardTitle>
            <p className="text-sm text-slate-500">Pengajuan desain dengan fasilitas untuk toko Alfamart</p>
          </CardHeader>
          <CardContent className="pt-4">
            {!!resubmitId && originalF && (originalF.bm_alasan_penolakan || originalF.pp1_alasan_penolakan) && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 text-red-800 font-bold mb-2">
                  <span className="w-5 h-5 rounded bg-red-200 flex items-center justify-center text-xs">!</span>
                  Alasan Penolakan ({originalF.pp1_alasan_penolakan ? 'PP Specialist' : 'B&M Manager'})
                </div>
                <p className="text-sm text-red-700 bg-white p-3 rounded border border-red-100">
                  {originalF.pp1_alasan_penolakan || originalF.bm_alasan_penolakan}
                </p>
                <p className="text-xs text-red-600 mt-2 font-medium">
                  * Minimal lakukan 1 perubahan pada form ini untuk dapat mengirim ulang pengajuan.
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* === SECTION: Pilih Toko === */}
              <SectionTitle icon={<Building2 className="w-4 h-4" />} title="Informasi Toko" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opsi 1: Renovasi */}
                <div
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 ${!isManualUlok ? "border-red-500 bg-red-50/50 shadow-sm" : "border-slate-200 bg-white hover:border-red-200 hover:shadow-sm"
                    } ${!!resubmitId && isManualUlok ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  onClick={() => {
                    if (!!resubmitId) return;
                    setIsManualUlok(false);
                    setF(p => ({ ...p, id_toko: 0, nomor_ulok: "", lingkup_pekerjaan: "", jenis_proyek: "", nama_lokasi: "" }));
                    setTokoSearch(""); setShowToko(false);
                    // Keep manual variables intact so user doesn't lose them if switching
                    setFotoFiles({}); setFotoExistingUrls({}); setActiveFotoTab(1);
                  }}
                >
                  <div className={`p-2.5 rounded-full ${!isManualUlok ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold ${!isManualUlok ? "text-red-900" : "text-slate-700"}`}>Toko Existing (Renovasi)</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Pilih toko yang sudah terdaftar di master data (Proyek Renovasi).</p>
                  </div>
                  {!isManualUlok && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-red-500" />}
                </div>

                {/* Opsi 2: Reguler / Baru */}
                <div
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 ${isManualUlok ? "border-blue-500 bg-blue-50/50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"
                    } ${!!resubmitId && !isManualUlok ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  onClick={() => {
                    if (!!resubmitId) return;
                    setIsManualUlok(true);
                    setF(p => ({ ...p, id_toko: 0, nomor_ulok: "", lingkup_pekerjaan: "", jenis_proyek: "Reguler", nama_lokasi: "", akhir_masa_sewa: "", spd: "", link_ba_tidak_sesuai_standar: "" }));
                    setTokoSearch(""); setShowToko(false);
                    setFotoFiles({}); setFotoExistingUrls({}); setActiveFotoTab(1); setFileBaTidakSesuaiStandar([]);
                  }}
                >
                  <div className={`p-2.5 rounded-full ${isManualUlok ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold ${isManualUlok ? "text-blue-900" : "text-slate-700"}`}>Toko Baru (Reguler)</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Buat ULOK manual untuk pengajuan toko baru dari nol (Reguler).</p>
                  </div>
                  {isManualUlok && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-blue-500" />}
                </div>
              </div>

              {/* Dynamic Content based on Selection */}
              <div className="mt-6">
                {!isManualUlok ? (
                  <div className="space-y-5 p-5 border border-red-100 rounded-xl bg-red-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700">Nama Toko *</Label>
                        <Input value={manualNamaToko} onChange={e => setManualNamaToko(e.target.value)} placeholder="Masukkan nama toko" required className="h-11 bg-white border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-400" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700">Kode Toko (Opsional)</Label>
                        <Input value={manualKodeToko} onChange={e => setManualKodeToko(e.target.value)} placeholder="Misal: A123" className="h-11 bg-white border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-400" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-bold text-slate-700">Proyek *</Label>
                        <select value={f.jenis_proyek} onChange={e => set("jenis_proyek", e.target.value)} required className="w-full h-11 px-3 rounded-md border border-slate-200 bg-white text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400">
                          <option value="">Pilih proyek...</option>
                          <option value="Perpanjangan">Perpanjangan</option>
                          <option value="Peremajaan/Perbaikan">Peremajaan/Perbaikan</option>
                          <option value="Perluasan">Perluasan</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-red-500" /> Nomor ULOK (Format Renovasi) *
                      </Label>
                      <div className="flex items-center gap-3">
                        <Input placeholder="Cabang" className="h-11 w-[25%] bg-slate-100 uppercase text-slate-600 font-bold cursor-not-allowed border-slate-200" value={manualCabang} readOnly tabIndex={-1} maxLength={4} required />
                        <span className="font-bold text-slate-300">-</span>
                        <Input placeholder="YYMM" className="h-11 w-[25%] bg-white border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-400" value={manualTanggal} onChange={(e) => setManualTanggal(e.target.value)} maxLength={4} required />
                        <span className="font-bold text-slate-300">-</span>
                        <Input placeholder="0001" className="h-11 w-[35%] bg-white uppercase border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-400" value={manualUrutan} onChange={(e) => setManualUrutan(e.target.value.toUpperCase())} maxLength={4} required />
                        <span className="font-bold text-slate-300">-</span>
                        <Input className="h-11 w-[15%] bg-slate-100 uppercase text-slate-600 font-bold cursor-not-allowed border-slate-200 text-center" value="R" readOnly tabIndex={-1} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700">Alamat Lengkap *</Label>
                      <Input value={manualAlamat} onChange={e => setManualAlamat(e.target.value)} placeholder="Masukkan alamat lengkap proyek" required className="h-11 bg-white border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-400" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700">Link Google Maps</Label>
                      <Input value={(f as any).link_google_maps} onChange={e => set("link_google_maps", e.target.value)} placeholder="https://maps.google.com/..." className="h-11 bg-white border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-400" />
                    </div>
                    <div className="rounded-xl border border-red-100 bg-white/80 p-4 shadow-sm">
                      <h4 className="text-sm font-bold text-red-900 mb-3">Data Khusus Renovasi</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-slate-700">Akhir Masa Sewa</Label>
                          <Input
                            type="date"
                            value={(f as any).akhir_masa_sewa}
                            onChange={e => set("akhir_masa_sewa", e.target.value)}
                            className="h-11 bg-white border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-slate-700">SPD</Label>
                          <Input
                            value={(f as any).spd}
                            onChange={e => set("spd", formatRupiahInput(e.target.value))}
                            placeholder="Contoh: Rp 13.600.000"
                            className="h-11 bg-white border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-400"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm font-bold text-slate-700">Lampiran Berita Acara Tidak Sesuai Standar</Label>
                          <p className="text-xs text-slate-500">Apabila ada pekerjaan yang tidak sesuai standar dan approval hingga Branch Manager.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Input
                              placeholder="Link Google Drive..."
                              value={(f as any).link_ba_tidak_sesuai_standar}
                              onChange={e => { set("link_ba_tidak_sesuai_standar", e.target.value); setFileBaTidakSesuaiStandar([]); }}
                              className="bg-white"
                              disabled={fileBaTidakSesuaiStandar.length > 0}
                            />
                            <div>
                              <Input
                                type="file"
                                accept="image/*,.pdf"
                                multiple
                                className="bg-white file:bg-red-50 file:text-red-600 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 hover:file:bg-red-100 cursor-pointer"
                                onChange={handleMultiFileChange(setFileBaTidakSesuaiStandar, () => set("link_ba_tidak_sesuai_standar", ""))}
                              />
                              {fileBaTidakSesuaiStandar.length > 0 && <p className="text-[10px] text-red-600 mt-1">File siap diupload: {fileBaTidakSesuaiStandar.map(file => file.name).join(", ")}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 p-5 border border-blue-100 rounded-xl bg-blue-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700">Nama Toko *</Label>
                        <Input value={manualNamaToko} onChange={e => setManualNamaToko(e.target.value)} placeholder="Masukkan nama toko" required className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700">Kode Toko (Opsional)</Label>
                        <Input value={manualKodeToko} onChange={e => setManualKodeToko(e.target.value)} placeholder="Misal: A123" className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-blue-500" /> Nomor ULOK Baru *
                        </Label>
                        <div className="flex items-center gap-3">
                          <Input placeholder="Cabang" className="h-11 w-[30%] bg-slate-100 uppercase text-slate-600 font-bold cursor-not-allowed border-slate-200" value={manualCabang} readOnly tabIndex={-1} maxLength={4} required />
                          <span className="font-bold text-slate-300">-</span>
                          <Input placeholder="YYMM" className="h-11 w-[30%] bg-white border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400" value={manualTanggal} onChange={(e) => setManualTanggal(e.target.value)} maxLength={4} required />
                          <span className="font-bold text-slate-300">-</span>
                          <Input placeholder="0001" className="h-11 w-[40%] bg-white uppercase border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400" value={manualUrutan} onChange={(e) => setManualUrutan(e.target.value.toUpperCase())} maxLength={4} required />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700">Alamat Lengkap *</Label>
                      <Input value={manualAlamat} onChange={e => setManualAlamat(e.target.value)} placeholder="Masukkan alamat lengkap proyek" required className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700">Link Google Maps</Label>
                      <Input value={(f as any).link_google_maps} onChange={e => set("link_google_maps", e.target.value)} placeholder="https://maps.google.com/..." className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-600">Nama Pengaju *</Label>
                  <Input value={f.nama_pengaju} onChange={e => set("nama_pengaju", e.target.value)} required className="mt-1" />
                </div>
              </div>

              {/* === SECTION: Luasan === */}
              <SectionTitle icon={<Building2 className="w-4 h-4" />} title="Data Luasan & Dimensi" />
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    ["luas_bangunan", "Luas Bangunan (m²)"],
                    ["luas_area_terbuka", "Luas Area Terbuka (m²)"],
                    ["luas_area_terbangun", "Luas Area Terbangun (m²)", "Auto"],
                    ["luas_gudang", "Luas Gudang (m²)"],
                    ["luas_area_parkir", "Luas Area Parkir (m²)"],
                    ["luas_area_sales", "Luas Area Sales (m²)", isRabApproved === true ? "Auto RAB" : ""],
                  ].map(([key, label, badge]) => {
                    const isAuto = key === "luas_area_terbangun" || (key === "luas_area_sales" && isRabApproved === true);
                    return (
                      <div key={key}>
                        <Label className="text-xs font-semibold text-slate-600">
                          {label} {badge && <span className="text-[10px] font-bold text-blue-600">({badge})</span>}
                        </Label>
                        <Input
                          type="number" min="0" step="0.01"
                          value={(f as any)[key]} onChange={e => set(key, e.target.value)}
                          readOnly={isAuto}
                          tabIndex={key === "luas_area_terbangun" ? -1 : undefined}
                          placeholder="0.00"
                          className={`mt-1 ${isAuto ? "bg-blue-50 border-blue-200 font-semibold text-blue-800 cursor-not-allowed" : ""}`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">Dimensi Bangunan</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold text-slate-600">P Bangunan</Label>
                        <Input type="number" min="0" step="0.01" value={(f as any).p_bangunan} onChange={e => set("p_bangunan", e.target.value)} placeholder="0.00" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-slate-600">L Bangunan</Label>
                        <Input type="number" min="0" step="0.01" value={(f as any).l_bangunan} onChange={e => set("l_bangunan", e.target.value)} placeholder="0.00" className="mt-1" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">Dimensi Area Parkir</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold text-slate-600">P Area Parkir</Label>
                        <Input type="number" min="0" step="0.01" value={(f as any).p_area_parkir} onChange={e => set("p_area_parkir", e.target.value)} placeholder="0.00" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-slate-600">L Area Parkir</Label>
                        <Input type="number" min="0" step="0.01" value={(f as any).l_area_parkir} onChange={e => set("l_area_parkir", e.target.value)} placeholder="0.00" className="mt-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {false && (
              <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  ["luas_bangunan", "Luas Bangunan (m²)"],
                  ["luas_area_terbuka", "Luas Area Terbuka (m²)"],
                  ["luas_area_terbangun", "Luas Area Terbangun (m²)"],
                  ["luas_gudang", "Luas Gudang (m²)"],
                  ["luas_area_parkir", "Luas Area Parkir (m²)"],
                  ["luas_area_sales", "Luas Area Sales (m²)"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <Label className="text-xs font-semibold text-slate-600">{label}</Label>
                    <Input
                      type="number" min="0" step="0.01"
                      value={(f as any)[key]} onChange={e => set(key, e.target.value)}
                      placeholder="0.00" className="mt-1"
                    />
                  </div>
                ))}
                <div>
                  <Label className="text-xs font-semibold text-slate-600">P Bangunan</Label>
                  <Input type="number" min="0" step="0.01" value={(f as any).p_bangunan} onChange={e => set("p_bangunan", e.target.value)} placeholder="0.00" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600">L Bangunan</Label>
                  <Input type="number" min="0" step="0.01" value={(f as any).l_bangunan} onChange={e => set("l_bangunan", e.target.value)} placeholder="0.00" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600">P Area Parkir</Label>
                  <Input type="number" min="0" step="0.01" value={(f as any).p_area_parkir} onChange={e => set("p_area_parkir", e.target.value)} placeholder="0.00" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600">L Area Parkir</Label>
                  <Input type="number" min="0" step="0.01" value={(f as any).l_area_parkir} onChange={e => set("l_area_parkir", e.target.value)} placeholder="0.00" className="mt-1" />
                </div>
              </div>

              {/* === SECTION: Fasilitas Khusus === */}
              <SectionTitle icon={<Droplets className="w-4 h-4" />} title="Fasilitas Tambahan" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-600">Sumber Air Bersih</Label>
                  <select value={(f as any).sumber_air_bersih} onChange={e => set("sumber_air_bersih", e.target.value)} className="w-full mt-1 h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400">
                    <option value="">Pilih Sumber Air...</option>
                    <option value="PAM">PAM</option>
                    <option value="Sumur Eksisting">Sumur Eksisting</option>
                    <option value="Sumur Bor">Sumur Bor</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600">Drain Pembuangan Air Kotor</Label>
                  <select value={(f as any).drainase_air_kotor} onChange={e => set("drainase_air_kotor", e.target.value)} className="w-full mt-1 h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400">
                    <option value="">Pilih Drainase...</option>
                    <option value="Septictank">Septictank</option>
                    <option value="Toilet Eksisting">Toilet Eksisting</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">AC (Jumlah Unit)</Label>
                    <Input type="number" min="0" value={(f as any).jumlah_ac} onChange={e => set("jumlah_ac", e.target.value)} placeholder="0" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">AC (PK)</Label>
                    <Input type="number" min="0" step="0.1" value={(f as any).pk_ac} onChange={e => set("pk_ac", e.target.value)} placeholder="0.0" className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">Listrik (VA)</Label>
                    <Input type="number" min="0" step="100" value={(f as any).listrik_va} onChange={e => set("listrik_va", e.target.value)} placeholder="0" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">Listrik (Phase)</Label>
                    <Input type="number" min="0" value={(f as any).listrik_phase} onChange={e => set("listrik_phase", e.target.value)} placeholder="0" className="mt-1" />
                  </div>
                </div>
              </div>
              </>
              )}

              {/* === SECTION: Jenis Pengajuan === */}
              <SectionTitle icon={<FileText className="w-4 h-4" />} title="Form Permintaan Desain Dengan Fasilitas" />
              <p className="text-xs text-slate-500 mb-2">Pilih satu atau lebih jenis pengajuan desain (bisa multi-pilih)</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {JENIS_OPTIONS.map(j => {
                  const isActive = jenisSelected.includes(j);
                  const isDisabled = isDarkStoreDesign && j !== DARK_STORE_OPTION;
                  return (
                    <button key={j} type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        setJenisSelected(prev => {
                          if (j === DARK_STORE_OPTION) {
                            const next = isActive ? [] : [DARK_STORE_OPTION];
                            if (!isActive) {
                              setIsHeadToHead(false);
                              setIsSeatingArea(false);
                              setFileGambarKompetitor([]);
                              set("link_gambar_kompetitor", "");
                            }
                            return next;
                          }
                          return isActive ? prev.filter(x => x !== j) : [...prev.filter(x => x !== DARK_STORE_OPTION), j];
                        });
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                        isActive
                          ? "bg-red-600 text-white border-red-600 shadow-sm"
                          : isDisabled
                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                            : "bg-white text-slate-600 border-slate-200 hover:border-red-300"
                      }`}>
                      {isActive && <span className="text-xs">✓</span>} {j}
                    </button>
                  );
                })}
              </div>
              {jenisSelected.includes("LAINNYA") && (
                <Input value={f.jenis_pengajuan_lainnya} onChange={e => set("jenis_pengajuan_lainnya", e.target.value)}
                  placeholder="Sebutkan jenis pengajuan lainnya..." className="mt-2" />
              )}

              {/* BEAN SPOT Sub-Type */}
              {jenisSelected.includes("BEAN SPOT") && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <Label className="text-sm font-semibold text-amber-800 mb-2 block">Tipe Bean Spot</Label>
                  <div className="flex flex-wrap gap-2">
                    {BEANSPOT_TIPE_OPTIONS.map(tipe => (
                      <button key={tipe} type="button"
                        onClick={() => setBeanspotTipe(prev => prev === tipe ? "" : tipe)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                          beanspotTipe === tipe ? "bg-amber-600 text-white border-amber-600" : "bg-white text-amber-700 border-amber-300 hover:border-amber-500"
                        }`}>
                        {tipe}
                      </button>
                    ))}
                  </div>
                  {beanspotTipe && <p className="text-xs text-amber-700 mt-2 font-medium">Tipe dipilih: {beanspotTipe}</p>}
                </div>
              )}

              {/* === SECTION: Tipe Bangunan & Kategori Toko === */}
              <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipe Bangunan */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Tipe Bangunan</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="is_ruko" checked={!f.is_ruko} onChange={() => set("is_ruko", false)} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                        <span className="text-sm">Non-Ruko</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="is_ruko" checked={f.is_ruko} onChange={() => set("is_ruko", true)} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                        <span className="text-sm">Ruko</span>
                      </label>
                    </div>
                  </div>
                  {/* Jumlah Lantai — untuk Ruko DAN Non-Ruko */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">
                      Jumlah Lantai {f.is_ruko ? "(Ruko)" : "(Non-Ruko)"}
                    </Label>
                    <Input type="number" min="1" max="20" value={f.jumlah_lantai} onChange={e => set("jumlah_lantai", e.target.value)} placeholder="Contoh: 1" className="h-10" />
                  </div>
                </div>

                {!isDarkStoreDesign && (
                  <div className="pt-2 border-t border-slate-100">
                    <Label className="text-sm font-bold text-slate-700 mb-2 block">Kategori Toko</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="is_dark_store" checked={!isDarkStore} onChange={() => setIsDarkStore(false)} className="w-4 h-4 text-red-600" />
                        <span className="text-sm">Reguler</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="is_dark_store" checked={isDarkStore} onChange={() => setIsDarkStore(true)} className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-slate-700">B2B</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* === SECTION: Head to Head & Seating Area === */}
              {!isDarkStoreDesign && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {/* Head to Head */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                  <Label className="text-sm font-bold text-slate-700">🏪 Apakah Toko Head to Head?</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="is_head_to_head" checked={!isHeadToHead || isDarkStoreDesign} onChange={() => setIsHeadToHead(false)} className="w-4 h-4 text-red-600" disabled={isDarkStoreDesign} />
                      <span className="text-sm">Tidak</span>
                    </label>
                    <label className={`flex items-center gap-2 ${isDarkStoreDesign ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                      <input type="radio" name="is_head_to_head" checked={isHeadToHead && !isDarkStoreDesign} onChange={() => setIsHeadToHead(true)} className="w-4 h-4 text-red-600" disabled={isDarkStoreDesign} />
                      <span className="text-sm font-semibold text-red-700">Ya</span>
                    </label>
                  </div>
                  {isHeadToHead && !isDarkStoreDesign && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <Label className="text-xs font-semibold text-slate-600">Jarak Head to Head *</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          placeholder="0"
                          value={(f as any).jarak_head_to_head}
                          onChange={e => set("jarak_head_to_head", e.target.value.replace(/[^0-9]/g, ""))}
                          className="bg-white"
                        />
                        <span className="text-sm font-bold text-slate-600">m</span>
                      </div>
                      <Label className="text-xs font-semibold text-slate-600">Gambar Kompetitor *</Label>
                      <Input placeholder="Link Google Drive..." value={(f as any).link_gambar_kompetitor} onChange={e => { set("link_gambar_kompetitor", e.target.value); setFileGambarKompetitor([]); }} className="bg-white" disabled={fileGambarKompetitor.length > 0} />
                      <Input type="file" accept="image/png, image/jpeg" multiple className="file:bg-slate-100 file:text-slate-600 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 hover:file:bg-slate-200 cursor-pointer"
                        onChange={handleMultiFileChange(setFileGambarKompetitor, () => set("link_gambar_kompetitor", ""))} />
                      {fileGambarKompetitor.length > 0 && <p className="text-[10px] text-slate-600">File siap: {fileGambarKompetitor.map(file => file.name).join(", ")}</p>}
                    </div>
                  )}
                </div>

                {/* Seating Area */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                  <Label className="text-sm font-bold text-slate-700">🪑 Apakah Ada Seating Area?</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="is_seating_area" checked={!isSeatingArea || isDarkStoreDesign} onChange={() => setIsSeatingArea(false)} className="w-4 h-4 text-red-600" disabled={isDarkStoreDesign} />
                      <span className="text-sm">Tidak</span>
                    </label>
                    <label className={`flex items-center gap-2 ${isDarkStoreDesign ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                      <input type="radio" name="is_seating_area" checked={isSeatingArea && !isDarkStoreDesign} onChange={() => setIsSeatingArea(true)} className="w-4 h-4 text-red-600" disabled={isDarkStoreDesign} />
                      <span className="text-sm font-semibold text-green-700">Ya</span>
                    </label>
                  </div>
                </div>
              </div>
              )}

              {/* === SECTION: Fasilitas dipindahkan ke inputan kedua === */}
              {false && (
              <>
              <SectionTitle icon={<Droplets className="w-4 h-4" />} title="Fasilitas Yang Disediakan" />
              {fasilitas.map((fac, idx) => {
                if (fac.jenis_fasilitas === "LAINNYA") return null;
                const labels: Record<string, string> = {
                  "AIR_BERSIH": "Sumber Air Bersih",
                  "DRAINASE": "Drain Pembuangan Air Kotor",
                  "AC": "AC",
                  "LISTRIK": "Listrik",
                };
                const icons: Record<string, any> = {
                  "AIR_BERSIH": <Droplets className="w-3.5 h-3.5" />,
                  "DRAINASE": <Wind className="w-3.5 h-3.5" />,
                  "AC": <Zap className="w-3.5 h-3.5" />,
                  "LISTRIK": <Zap className="w-3.5 h-3.5 text-yellow-500" />,
                };
                // AC uses special placeholder for unit count
                const placeholder = fac.jenis_fasilitas === "AC"
                  ? "Jumlah Unit AC (contoh: 2 unit 1.5 PK)"
                  : fac.jenis_fasilitas === "LISTRIK"
                    ? "Daya listrik (contoh: 7700 VA / 3 Phase)"
                    : `Keterangan ${labels[fac.jenis_fasilitas]}...`;
                return (
                  <div key={idx} className="p-3 border rounded-lg space-y-2 bg-white">
                    <div className="flex items-center gap-2">
                      <Checkbox id={`fas_${fac.jenis_fasilitas}`} checked={fac.is_tersedia}
                        onCheckedChange={v => {
                          const newF = [...fasilitas];
                          newF[idx].is_tersedia = !!v;
                          setFasilitas(newF);
                        }} />
                      <label htmlFor={`fas_${fac.jenis_fasilitas}`} className="text-sm font-medium flex items-center gap-1.5">
                        {icons[fac.jenis_fasilitas]} {labels[fac.jenis_fasilitas]}
                      </label>
                    </div>
                    {fac.is_tersedia && fac.jenis_fasilitas === "AIR_BERSIH" && (
                      <select
                        value={fac.keterangan || ""}
                        onChange={e => {
                          const newF = [...fasilitas];
                          newF[idx].keterangan = e.target.value;
                          setFasilitas(newF);
                        }}
                        className="w-full text-sm h-9 rounded-md border border-slate-200 bg-white px-3"
                      >
                        <option value="">Pilih Sumber Air...</option>
                        <option value="PAM">PAM</option>
                        <option value="Sumur Eksisting">Sumur Eksisting</option>
                        <option value="Sumur Bor">Sumur Bor</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    )}
                    {fac.is_tersedia && fac.jenis_fasilitas === "DRAINASE" && (
                      <select
                        value={fac.keterangan || ""}
                        onChange={e => {
                          const newF = [...fasilitas];
                          newF[idx].keterangan = e.target.value;
                          setFasilitas(newF);
                        }}
                        className="w-full text-sm h-9 rounded-md border border-slate-200 bg-white px-3"
                      >
                        <option value="">Pilih Drainase...</option>
                        <option value="Septictank">Septictank</option>
                        <option value="Toilet Eksisting">Toilet Eksisting</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    )}
                    {fac.is_tersedia && fac.jenis_fasilitas === "AC" && (
                      <div className="flex items-center gap-2">
                        <Input type="number" placeholder="Unit" min="0"
                          value={fac.keterangan?.match(/(\d+)\s*Unit/)?.[1] || ""}
                          onChange={e => {
                            const pk = fac.keterangan?.match(/([\d.]+)\s*PK/)?.[1] || "";
                            const newF = [...fasilitas];
                            newF[idx].keterangan = `${e.target.value} Unit ${pk} PK`;
                            setFasilitas(newF);
                          }} className="text-sm w-20 bg-white" />
                        <span className="text-xs font-bold text-slate-500">Unit</span>
                        <Input type="number" step="0.5" placeholder="PK" min="0"
                          value={fac.keterangan?.match(/([\d.]+)\s*PK/)?.[1] || ""}
                          onChange={e => {
                            const unit = fac.keterangan?.match(/(\d+)\s*Unit/)?.[1] || "";
                            const newF = [...fasilitas];
                            newF[idx].keterangan = `${unit} Unit ${e.target.value} PK`;
                            setFasilitas(newF);
                          }} className="text-sm w-20 bg-white" />
                        <span className="text-xs font-bold text-slate-500">PK</span>
                      </div>
                    )}
                    {fac.is_tersedia && fac.jenis_fasilitas === "LISTRIK" && (
                      <div className="flex items-center gap-2">
                        <Input type="number" placeholder="VA" min="0"
                          value={fac.keterangan?.match(/(\d+)\s*VA/)?.[1] || ""}
                          onChange={e => {
                            const phase = fac.keterangan?.match(/(\d+)\s*Phase/)?.[1] || "";
                            const newF = [...fasilitas];
                            newF[idx].keterangan = `${e.target.value} VA / ${phase} Phase`;
                            setFasilitas(newF);
                          }} className="text-sm w-28 bg-white" />
                        <span className="text-xs font-bold text-slate-500">VA</span>
                        <Input type="number" placeholder="Phase" min="0"
                          value={fac.keterangan?.match(/(\d+)\s*Phase/)?.[1] || ""}
                          onChange={e => {
                            const va = fac.keterangan?.match(/(\d+)\s*VA/)?.[1] || "";
                            const newF = [...fasilitas];
                            newF[idx].keterangan = `${va} VA / ${e.target.value} Phase`;
                            setFasilitas(newF);
                          }} className="text-sm w-20 bg-white" />
                        <span className="text-xs font-bold text-slate-500">Phase</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {fasilitas.map((fac, idx) => {
                if (fac.jenis_fasilitas !== "LAINNYA") return null;
                return (
                  <div key={`lainnya-${idx}`} className="p-3 border rounded-lg space-y-2 bg-white">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-sm font-medium">Fasilitas Lainnya</Label>
                      {fasilitas.filter(f => f.jenis_fasilitas === "LAINNYA").length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFasilitas(fasilitas.filter((_, itemIdx) => itemIdx !== idx))}
                          className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          Hapus
                        </Button>
                      )}
                    </div>
                    <Input value={fac.nama_fasilitas_lainnya || ""}
                      onChange={e => {
                        const newF = [...fasilitas];
                        newF[idx] = {
                          ...newF[idx],
                          nama_fasilitas_lainnya: e.target.value,
                          is_tersedia: !!e.target.value.trim(),
                        };
                        setFasilitas(newF);
                      }} placeholder="Nama fasilitas lainnya..." />
                    {!!fac.nama_fasilitas_lainnya && (
                      <Input value={fac.keterangan || ""}
                        onChange={e => {
                          const newF = [...fasilitas];
                          newF[idx] = { ...newF[idx], keterangan: e.target.value };
                          setFasilitas(newF);
                        }} placeholder="Keterangan fasilitas lainnya..." />
                    )}
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFasilitas([...fasilitas, { jenis_fasilitas: "LAINNYA", nama_fasilitas_lainnya: "", is_tersedia: false, keterangan: "" }])}
                className="mt-2 text-xs"
              >
                + Tambah Fasilitas Lainnya
              </Button>
              </>
              )}

              {/* === SECTION: Ketentuan === */}
              <SectionTitle icon={<FileText className="w-4 h-4" />} title="Ketentuan dari Pengelola / Landlord / Pihak Ketiga" />
              {ketentuan.map((k, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Label className="text-xs text-slate-500">Ketentuan {i + 1}</Label>
                    <Input value={k} onChange={e => {
                      const newK = [...ketentuan];
                      newK[i] = e.target.value;
                      setKetentuan(newK);
                    }} placeholder={`Ketentuan ${i + 1}...`} className="mt-1" />
                  </div>
                  {ketentuan.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setKetentuan(ketentuan.filter((_, idx) => idx !== i))} className="mt-5 text-red-500 hover:text-red-700 hover:bg-red-50">
                      Hapus
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setKetentuan([...ketentuan, ""])} className="mt-2 text-xs">
                + Tambah Ketentuan
              </Button>

              {/* === SECTION: Catatan Desain === */}
              <SectionTitle icon={<ClipboardList className="w-4 h-4" />} title="Catatan Desain (Hasil Ukur & Kondisi Lingkungan)" />
              {catatanDesign.map((c, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Label className="text-xs text-slate-500">Catatan {i + 1}</Label>
                    <Textarea value={c} onChange={e => {
                      const newC = [...catatanDesign];
                      newC[i] = e.target.value;
                      setCatatanDesign(newC);
                    }} placeholder={`Catatan ${i + 1}...`} rows={2} className="mt-1" />
                  </div>
                  {catatanDesign.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCatatanDesign(catatanDesign.filter((_, idx) => idx !== i))} className="mt-5 text-red-500 hover:text-red-700 hover:bg-red-50">
                      Hapus
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setCatatanDesign([...catatanDesign, ""])} className="mt-2 text-xs">
                + Tambah Catatan
              </Button>



              {/* === SECTION: Upload Files === */}
              <SectionTitle icon={<FileText className="w-4 h-4" />} title="Upload Gambar Kerja & Siteplan (Link / File Lokal)" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600">Gambar Kerja Sipil</Label>
                  <Input placeholder="Link Google Drive..." value={(f as any).link_fpd} onChange={e => { set("link_fpd", e.target.value); setFileFpd([]); }} className="bg-white" disabled={fileFpd.length > 0} />
                  <Input type="file" accept="image/*,.pdf,.dwg" multiple className="mt-1 file:bg-red-50 file:text-red-600 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 hover:file:bg-red-100 cursor-pointer"
                    onChange={handleMultiFileChange(setFileFpd, () => set("link_fpd", ""))} />
                  {fileFpd.length > 0 ? <p className="text-[10px] text-red-600 mt-1">File siap diupload: {fileFpd.map(file => file.name).join(", ")}</p> : <p className="text-[10px] text-slate-400 mt-1">Maksimal 2 file, atau paste link Google Drive</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600">Gambar Kerja ME</Label>
                  <Input placeholder="Link Google Drive..." value={(f as any).link_gambar_kerja} onChange={e => { set("link_gambar_kerja", e.target.value); setFileGambarKerjaMe([]); }} className="bg-white" disabled={fileGambarKerjaMe.length > 0} />
                  <Input type="file" accept="image/*,.pdf,.dwg" multiple className="mt-1 file:bg-yellow-50 file:text-yellow-600 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 hover:file:bg-yellow-100 cursor-pointer"
                    onChange={handleMultiFileChange(setFileGambarKerjaMe, () => set("link_gambar_kerja", ""))} />
                  {fileGambarKerjaMe.length > 0 ? <p className="text-[10px] text-yellow-600 mt-1">File siap diupload: {fileGambarKerjaMe.map(file => file.name).join(", ")}</p> : <p className="text-[10px] text-slate-400 mt-1">Maksimal 2 file, atau paste link Google Drive</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600">Siteplan</Label>
                  <Input placeholder="Link Google Drive..." value={(f as any).link_siteplan} onChange={e => { set("link_siteplan", e.target.value); setFileSiteplan([]); }} className="bg-white" disabled={fileSiteplan.length > 0} />
                  <Input type="file" accept="image/*,.pdf,.dwg" multiple className="mt-1 file:bg-blue-50 file:text-blue-600 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 hover:file:bg-blue-100 cursor-pointer"
                    onChange={handleMultiFileChange(setFileSiteplan, () => set("link_siteplan", ""))} />
                  {fileSiteplan.length > 0 ? <p className="text-[10px] text-blue-600 mt-1">File siap diupload: {fileSiteplan.map(file => file.name).join(", ")}</p> : <p className="text-[10px] text-slate-400 mt-1">Maksimal 2 file, atau paste link Google Drive</p>}
                </div>

              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-600">Keterangan Tambahan</Label>
                <Textarea value={f.keterangan} onChange={e => set("keterangan", e.target.value)}
                  placeholder="Keterangan tambahan..." rows={3} className="mt-1" />
              </div>

              {/* === SECTION: Foto FPD === */}
              {(isManualUlok || f.id_toko > 0 || !!f.jenis_proyek) && (
                <>
                  <SectionTitle icon={<Camera className="w-4 h-4" />} title="Dokumentasi Foto FPD (Opsional)" />
                  <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-6">

                    {/* Tab Navigation Segmented */}
                    <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-max mx-auto shadow-inner overflow-x-auto">
                      {[1, 2, 3].map((page) => (
                        <button
                          key={page}
                          type="button"
                          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap flex-1 md:flex-none ${activeFotoTab === page
                            ? "bg-white text-red-600 shadow-sm ring-1 ring-slate-200/50"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            }`}
                          onClick={() => setActiveFotoTab(page)}
                        >
                          {PAGE_LABELS[page]}
                        </button>
                      ))}
                    </div>

                    {/* MENAMPILKAN DENAH JIKA OPSI RENOVASI */}
                    {!isManualUlok && FLOOR_IMAGES[activeFotoTab] && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                          <h4 className="text-xs font-bold text-slate-700 flex items-center justify-center gap-2">
                            <MapPin className="w-4 h-4 text-red-500" /> Panduan Denah - {PAGE_LABELS[activeFotoTab]}
                          </h4>
                        </div>
                        <div className="p-2 md:p-4 flex justify-center bg-slate-100/50">
                          <img
                            src={FLOOR_IMAGES[activeFotoTab]}
                            alt={`Floor Plan ${PAGE_LABELS[activeFotoTab]}`}
                            className="w-full max-w-none h-auto object-contain max-h-[1100px] rounded mix-blend-multiply"
                          />
                        </div>
                      </div>
                    )}

                    {/* Grid Upload Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {PHOTO_POINTS[activeFotoTab]?.map((point) => {
                        const isSelected = !!fotoFiles[point.id];
                        const isExisting = !!fotoExistingUrls[point.id] && !isSelected;

                        return (
                          <div
                            key={point.id}
                            className={`relative flex flex-col p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                              ? "border-green-400 bg-green-50/30"
                              : isExisting
                                ? "border-blue-300 bg-blue-50/30"
                                : "border-dashed border-slate-300 bg-slate-50 hover:border-red-300 hover:bg-red-50/20"
                              }`}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <Label className="text-xs font-bold text-slate-700 leading-snug pr-6">
                                <span className="text-red-500 mr-1.5">{point.id}.</span>
                                {point.label}
                              </Label>
                              {isSelected && <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-green-500 bg-white rounded-full" />}
                              {isExisting && <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-blue-500 bg-white rounded-full" />}
                            </div>

                            <div className="mt-auto space-y-3">
                              {isExisting && (
                                <a
                                  href={fotoExistingUrls[point.id]}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded transition-colors w-max shadow-sm"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Lihat Foto Tersimpan
                                </a>
                              )}

                              <div className="flex gap-2">
                                {/* File Gallery */}
                                <label
                                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg border-2 text-xs font-bold cursor-pointer transition-all duration-200 select-none
                                    ${isSelected
                                      ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                                      : "border-slate-200 bg-white text-slate-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                                    }`}
                                >
                                  <FileImage className="w-3.5 h-3.5 flex-shrink-0" />
                                  Galeri
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null;
                                      setFotoFiles(prev => ({ ...prev, [point.id]: file }));
                                    }}
                                  />
                                </label>

                                {/* Camera Button — opens getUserMedia modal */}
                                <button
                                  type="button"
                                  onClick={() => openCamera(point.id)}
                                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg border-2 text-xs font-bold cursor-pointer transition-all duration-200
                                    ${isSelected
                                      ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
                                    }`}
                                >
                                  <Camera className="w-3.5 h-3.5 flex-shrink-0" />
                                  Kamera
                                </button>
                              </div>
                              {isSelected && fotoFiles[point.id] && (
                                <p className="text-[10px] text-green-700 font-semibold truncate px-1 flex items-center gap-1.5 bg-green-100/50 py-1 rounded">
                                  <FileImage className="w-3.5 h-3.5 flex-shrink-0" />
                                  {fotoFiles[point.id]!.name}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Submit */}
              <Button type="submit" disabled={submitting} className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm gap-2 mt-4">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? "Mengirim..." : "Kirim Pengajuan FPD"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* ===== CAMERA MODAL ===== */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                  <Camera className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Ambil Foto Kamera</h3>
                  {cameraTargetId !== null && (
                    <p className="text-[11px] text-slate-400">Titik #{cameraTargetId}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={closeCamera}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors text-slate-500 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Camera Preview */}
            <div className="relative bg-black flex-1 min-h-[300px] flex items-center justify-center">
              {cameraError ? (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                    <Camera className="w-7 h-7 text-red-500" />
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{cameraError}</p>
                  <p className="text-xs text-slate-500">Coba gunakan tombol Galeri untuk memilih foto dari file manager.</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full object-cover"
                />
              )}
              {/* Viewfinder overlay */}
              {!cameraError && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/60 rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/60 rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/60 rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/60 rounded-br-lg" />
                </div>
              )}
            </div>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Action Buttons */}
            <div className="flex gap-3 px-5 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={closeCamera}
                className="flex-1 h-11 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              {!cameraError && (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  <Camera className="w-4 h-4" />
                  Ambil Foto
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">{alertMsg.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-center">{alertMsg.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction className={`w-full rounded-lg ${alertMsg.type === "success" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
              onClick={() => { if (alertMsg.type === "success") router.push("/projek-planning"); }}>
              {alertMsg.type === "success" ? "Lihat Daftar" : "Tutup"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function FormProjekPlanning() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" /></div>}>
      <FormProjekPlanningInner />
    </Suspense>
  );
}
