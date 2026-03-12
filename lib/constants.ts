export const OPNAME_API_URL = "https://opnamebnm-mgbe.onrender.com";
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://sparta-be.onrender.com";

import { 
    FileText, Stamp, FileSignature, Users, CheckSquare, 
    Camera, FilePlus, FolderArchive, BarChartHorizontal, AlertTriangle, Activity, PieChart
} from 'lucide-react';

export const ALL_MENUS = [
    { id: 'menu-rab', title: 'Penawaran Final Kontraktor', desc: 'Buat penawaran final.', href: '/rab', icon: FileText },
    { id: 'menu-materai', title: 'Dokumen Final RAB Termaterai', desc: 'Buat dan lihat RAB Final Termaterai.', href: '/materai', icon: Stamp },
    { id: 'menu-spk', title: 'Surat Perintah Kerja', desc: 'Form surat perintah kerja untuk kontraktor.', href: '/spk', icon: FileSignature },
    { id: 'menu-pengawasan', title: 'PIC Pengawasan', desc: 'Form input pic pengawasan pekerjaan proyek.', href: '/inputpic', icon: Users },
    { id: 'menu-opname', title: 'Opname', desc: 'Form opname proyek toko.', href: '/opname', icon: CheckSquare },
    { id: 'menu-dokumentasi', title: 'Dokumentasi Bangunan Toko Baru', desc: 'Form dokumentasi foto bangunan.', href: 'https://dokumentasi-bangunan.vercel.app/', icon: Camera, external: true },
    { id: 'menu-tambahspk', title: 'Tambahan Surat Perintah Kerja', desc: 'Form pertambahan hari surat perintah kerja.', href: '/tambahspk', icon: FilePlus },
    { id: 'menu-svdokumen', title: 'Penyimpanan Dokumen Toko', desc: 'Form penyimpanan dokumen.', href: '/svdokumen', icon: FolderArchive },
    { id: 'menu-gantt', title: 'Gantt Chart', desc: 'Progress pekerjaan toko.', href: '/gantt', icon: BarChartHorizontal },
    { id: 'menu-sp', title: 'Surat Peringatan', desc: 'Form surat peringatan.', href: '#', icon: AlertTriangle, isAlert: true },
    { id: 'menu-userlog', title: 'User Log', desc: 'Log aktivitas pengguna.', href: '/userlog', icon: Activity },
    { id: 'menu-monitoring', title: 'Monitoring Dashboard', desc: 'Pantau grafik progres dan status proyek real-time.', href: '/monitoring', icon: PieChart },
];

export const ROLE_CONFIG: Record<string, string[]> = {
    'BRANCH BUILDING & MAINTENANCE MANAGER': [
        'menu-spk', 'menu-pengawasan', 'menu-opname', 'menu-tambahspk', 'menu-gantt', 'menu-dokumentasi', 'menu-svdokumen', 'menu-sp', 'menu-monitoring'
    ],
    'BRANCH BUILDING SUPPORT DOKUMENTASI' : [
        'menu-spk', 'menu-pengawasan', 'menu-opname', 'menu-tambahspk', 'menu-gantt', 'menu-dokumentasi', 'menu-svdokumen', 'menu-sp', 'menu-monitoring'
    ],
    'BRANCH BUILDING COORDINATOR': [
        'menu-dokumentasi', 'menu-svdokumen','menu-gantt', 'menu-opname', 'menu-sp', 'menu-monitoring'
    ],
    'BRANCH BUILDING SUPPORT': [
        'menu-dokumentasi', 'menu-opname', 'menu-gantt', 'menu-svdokumen', 'menu-sp', 'menu-monitoring'
    ],
    'KONTRAKTOR': [
        'menu-rab', 'menu-materai', 'menu-opname', 'menu-gantt'
    ]
};

export const SIPIL_CATEGORIES = [
    "PEKERJAAN PERSIAPAN", "PEKERJAAN BOBOKAN / BONGKARAN", "PEKERJAAN TANAH",
    "PEKERJAAN PONDASI & BETON", "PEKERJAAN PASANGAN", "PEKERJAAN BESI",
    "PEKERJAAN KERAMIK", "PEKERJAAN PLUMBING", "PEKERJAAN SANITARY & ACECORIES",
    "PEKERJAAN JANITOR", "PEKERJAAN ATAP", "PEKERJAAN KUSEN, PINTU & KACA",
    "PEKERJAAN FINISHING", "PEKERJAAN BEANSPOT", "PEKERJAAN AREA TERBUKA",
    "PEKERJAAN TAMBAHAN", "PEKERJAAN SBO"
];

export const ME_CATEGORIES = [
    "INSTALASI", "FIXTURE", "PEKERJAAN TAMBAHAN", "PEKERJAAN SBO"
];

export const BRANCH_GROUPS: Record<string, string[]> = {
    "LOMBOK": ["LOMBOK", "SUMBAWA"],
    "MEDAN": ["MEDAN", "ACEH"],
    "LAMPUNG": ["LAMPUNG", "LAMPUNG_KOTABUMI"],
    "PALEMBANG": ["PALEMBANG", "BENGKULU", "BANGKA", "BELITUNG"],
    "SIDOARJO": ["SIDOARJO", "SIDOARJO BPN_SMD", "MANOKWARI", "NTT", "SORONG"]
};

export const BRANCH_TO_ULOK: Record<string, string> = {
    "LUWU": "2VZ1", "KARAWANG": "1JZ1", "REMBANG": "2AZ1", "BANJARMASIN": "1GZ1",
    "PARUNG": "1MZ1", "TEGAL": "2PZ1", "GORONTALO": "2SZ1", "PONTIANAK": "1PZ1",
    "LOMBOK": "1SZ1", "LAMPUNG_KOTABUMI": "LZ01", "SERANG": "2GZ1", "CIANJUR": "2JZ1",
    "BALARAJA": "TZ01", "SIDOARJO": "UZ01", "MEDAN": "WZ01", "BOGOR": "XZ01",
    "JEMBER": "YZ01", "BALI": "QZ01", "PALEMBANG": "PZ01", "KLATEN": "OZ01",
    "MAKASSAR": "RZ01", "PLUMBON": "VZ01", "PEKANBARU": "1AZ1", "JAMBI": "1DZ1",
    "HEAD OFFICE": "Z001", "BANDUNG RAYA": "BZ01", "BEKASI": "CZ01",
    "CILACAP": "IZ01", "CILEUNGSI": "JZ01", "SEMARANG": "HZ01", "CIKOKOL": "KZ01",
    "LAMPUNG": "LZ01", "MALANG": "MZ01", "MANADO": "1YZ1", "BATAM": "2DZ1",
    "MADIUN": "2MZ1", "CIKOKOL BINTAN": "KZ01"
};