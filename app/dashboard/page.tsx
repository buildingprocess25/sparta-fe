"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// Import Icon
import { 
    LogOut, FileText, Stamp, FileSignature, Users, CheckSquare, 
    Camera, FilePlus, FolderArchive, BarChartHorizontal, AlertTriangle, Activity 
} from 'lucide-react';

// --- DAFTAR SEMUA MENU ---
const ALL_MENUS = [
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
];

// --- KONFIGURASI ROLE ---
const ROLE_CONFIG: Record<string, string[]> = {
    'BRANCH BUILDING & MAINTENANCE MANAGER': [
        'menu-spk', 'menu-pengawasan', 'menu-opname', 'menu-tambahspk', 'menu-gantt', 'menu-dokumentasi', 'menu-svdokumen', 'menu-sp'
    ],
    'BRANCH BUILDING SUPPORT DOKUMENTASI' : [
        'menu-spk', 'menu-pengawasan', 'menu-opname', 'menu-tambahspk', 'menu-gantt', 'menu-dokumentasi', 'menu-svdokumen', 'menu-sp'
    ],
    'BRANCH BUILDING COORDINATOR': [
        'menu-dokumentasi', 'menu-svdokumen','menu-gantt', 'menu-opname', 'menu-sp'
    ],
    'BRANCH BUILDING SUPPORT': [
        'menu-dokumentasi', 'menu-opname', 'menu-gantt', 'menu-svdokumen', 'menu-sp'
    ],
    'KONTRAKTOR': [
        'menu-rab', 'menu-materai', 'menu-opname', 'menu-gantt'
    ]
};

export default function DashboardPage() {
    const router = useRouter();
    const [allowedMenus, setAllowedMenus] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const [featureAlertOpen, setFeatureAlertOpen] = useState(false);

    useEffect(() => {
        const userRole = sessionStorage.getItem('userRole'); 
        const userCabang = sessionStorage.getItem('loggedInUserCabang'); 

        if (!userRole) {
        alert("Sesi Anda telah habis. Silakan login kembali.");
        router.push('/auth');
        return;
        }

        const currentRole = userRole.toUpperCase(); 
        let allowedIds = ROLE_CONFIG[currentRole] ? [...ROLE_CONFIG[currentRole]] : [];

        const isHeadOffice = userCabang && userCabang.toUpperCase() === 'HEAD OFFICE';
        const isContractor = currentRole === 'KONTRAKTOR';

        if (isHeadOffice && !isContractor) {
            allowedIds.push('menu-userlog');
        }

        const filteredMenus = ALL_MENUS.filter(menu => allowedIds.includes(menu.id));
        setAllowedMenus(filteredMenus);
        setIsLoading(false);

    }, [router]);

    const handleLogout = () => {
        sessionStorage.clear();
        router.push('/');
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Memuat Dashboard...</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
        
        {/* HEADER BARU */}
        <header className="flex flex-col md:flex-row items-center justify-between p-4 md:px-8 bg-linear-to-r from-red-700 via-red-600 to-red-800 text-white shadow-md border-b border-red-900 sticky top-0 z-10">
            
            {/* Kiri: Group Logo dan Title */}
            <div className="flex items-center gap-3 md:gap-5 w-full md:w-auto justify-center md:justify-start mb-4 md:mb-0">
            {/* Logo Alfamart (Transparan & Drop Shadow) */}
            <img 
                src="/assets/Alfamart-Emblem.png" 
                alt="Alfamart Logo" 
                className="h-10 md:h-12 object-contain drop-shadow-md" 
            />
            
            {/* Garis Pemisah (Hanya muncul di Desktop) */}
            <div className="h-8 w-px bg-white/30 hidden md:block"></div>
            
            {/* Judul */}
            <h1 className="text-xl md:text-2xl font-extrabold tracking-widest drop-shadow-md">
                SPARTA
            </h1>
            
            {/* Garis Pemisah (Hanya muncul di Desktop) */}
            <div className="h-8 w-px bg-white/30 hidden md:block"></div>

            {/* Logo Building (Transparan & Drop Shadow) */}
            <img 
                src="/assets/Building-Logo.png" 
                alt="BM Logo" 
                className="h-10 md:h-12 hidden sm:block object-contain drop-shadow-md" 
            />
            </div>
            
            {/* Kanan: Logout Button */}
            <Button 
            variant="outline" 
            onClick={() => setLogoutDialogOpen(true)}
            className="bg-black/10 hover:bg-white hover:text-red-700 text-white border-white/30 w-full md:w-auto transition-all shadow-sm backdrop-blur-sm"
            >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
            </Button>
        </header>

        {/* MAIN CONTENT */}
        <main className="max-w-7xl mx-auto p-4 md:p-8 mt-2">
            <div className="mb-10 animate-in slide-in-from-top-4 duration-500 border-b pb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-slate-800">
                System for Property Administration, Reporting, Tracking & Approval
            </h2>
            <p className="text-slate-500 text-lg">Silakan pilih menu pekerjaan di bawah ini</p>
            </div>

            {/* MENU GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allowedMenus.map((menu) => {
                const IconComponent = menu.icon;

                // KONTEN CARD BARU
                const CardContentArea = (
                <Card className="h-full flex flex-col p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-red-400 cursor-pointer bg-white group">
                    
                    {/* Bagian Atas: Icon (Tengah) & Judul (Tengah) */}
                    <div className="flex flex-col items-center flex-1">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <IconComponent className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <CardHeader className="p-0 mb-4 w-full text-center">
                        <CardTitle className="text-lg font-bold text-slate-800 leading-snug group-hover:text-red-600 transition-colors">
                        {menu.title}
                        </CardTitle>
                    </CardHeader>
                    </div>

                    {/* Bagian Bawah: Deskripsi (Kiri Bawah) */}
                    <CardContent className="p-0 w-full text-left mt-auto pt-4 border-t border-slate-100">
                    <CardDescription className="text-sm text-slate-500 leading-relaxed">
                        {menu.desc}
                    </CardDescription>
                    </CardContent>

                </Card>
                );

                if (menu.isAlert) {
                return (
                    <div key={menu.id} onClick={() => setFeatureAlertOpen(true)} className="h-full">
                    {CardContentArea}
                    </div>
                );
                }

                if (menu.external) {
                return (
                    <a key={menu.id} href={menu.href} target="_blank" rel="noopener noreferrer" className="block h-full outline-none focus:ring-2 focus:ring-red-500 rounded-xl">
                    {CardContentArea}
                    </a>
                );
                }

                return (
                <Link key={menu.id} href={menu.href} className="block h-full outline-none focus:ring-2 focus:ring-red-500 rounded-xl">
                    {CardContentArea}
                </Link>
                );
            })}
            </div>

            {/* State Kosong */}
            {allowedMenus.length === 0 && !isLoading && (
            <div className="text-center p-10 bg-red-50 border border-red-200 rounded-2xl mt-8">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-700 mb-2">Tidak ada akses menu</h3>
                <p className="text-red-600">Role akun Anda tidak memiliki akses ke menu apapun di SPARTA.</p>
            </div>
            )}
        </main>

        {/* MODAL LOGOUT */}
        <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
            {/* ... (Kode Modal Tetap Sama) ... */}
            <AlertDialogContent className="rounded-2xl max-w-sm">
            <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
                <AlertDialogDescription>
                Apakah Anda yakin ingin keluar dari sistem SPARTA? Sesi Anda akan diakhiri.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">Ya, Logout</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* MODAL FITUR BELUM TERSEDIA */}
        <AlertDialog open={featureAlertOpen} onOpenChange={setFeatureAlertOpen}>
            {/* ... (Kode Modal Tetap Sama) ... */}
            <AlertDialogContent className="text-center rounded-2xl max-w-sm">
            <AlertDialogHeader>
                <div className="mx-auto bg-amber-100 text-amber-600 w-16 h-16 flex items-center justify-center rounded-full mb-4">
                <AlertTriangle className="w-8 h-8" />
                </div>
                <AlertDialogTitle className="text-center">Informasi</AlertDialogTitle>
                <AlertDialogDescription className="text-center">
                    Fitur Surat Peringatan belum tersedia saat ini.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center">
                <AlertDialogAction className="bg-amber-500 hover:bg-amber-600 w-full rounded-lg">Tutup</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        </div>
    );
}