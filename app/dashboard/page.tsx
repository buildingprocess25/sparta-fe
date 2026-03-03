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
// Import Icon statis yang masih dipakai langsung di UI (LogOut, AlertTriangle)
import { LogOut, AlertTriangle } from 'lucide-react';

// IMPORT MENU DAN ROLE DARI CONSTANTS
import { ALL_MENUS, ROLE_CONFIG } from '@/lib/constants';

export default function DashboardPage() {
    const router = useRouter();
    const [userInfo, setUserInfo] = useState({ name: '', role: '', cabang: '' });
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

        // Tampilkan hanya menu yang diizinkan untuk role saat ini
        const filteredMenus = ALL_MENUS.filter(menu => allowedIds.includes(menu.id));
        setAllowedMenus(filteredMenus);
        setIsLoading(false);

        const email = sessionStorage.getItem('loggedInUserEmail') || '';
        setUserInfo({
            name: email.split('@')[0].toUpperCase(),
            role: sessionStorage.getItem('userRole') || '',
            cabang: sessionStorage.getItem('loggedInUserCabang') || ''
        });
    }, [router]);

    const handleLogout = () => {
        sessionStorage.clear();
        router.push('/');
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Memuat Dashboard...</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
        
        {/* HEADER BARU */}
        <header className="flex items-center justify-between p-4 md:px-8 bg-linear-to-r from-red-700 via-red-600 to-red-800 text-white shadow-md border-b border-red-900 sticky top-0 z-20">
                {/* KIRI: Logo & Judul */}
                <div className="flex items-center gap-3 md:gap-5">
                    <img src="/assets/Alfamart-Emblem.png" alt="Logo" className="h-8 md:h-12 object-contain drop-shadow-md" />
                    <div className="h-6 md:h-8 w-px bg-white/30 hidden md:block"></div>
                    <h1 className="text-lg md:text-2xl font-bold md:font-extrabold tracking-widest drop-shadow-md">
                        SPARTA
                    </h1>
                    <img src="/assets/Building-Logo.png" alt="BM Logo" className="h-8 md:h-12 hidden sm:block object-contain drop-shadow-md" />
                </div>

                {/* TENGAH: Info User */}
                {userInfo.name && (
                    <div className="hidden md:flex flex-col items-center justify-center absolute left-1/2 transform -translate-x-1/2 text-center w-full max-w-75 pointer-events-none">
                        <span className="text-[13px] md:text-sm font-bold text-white drop-shadow-md truncate w-full">
                            {userInfo.name}
                        </span>
                        <span className="text-[10px] md:text-xs font-medium text-red-50 bg-black/20 px-3 py-0.5 rounded-full mt-0.5 backdrop-blur-sm border border-white/10 shadow-inner truncate max-w-[90%]">
                            {userInfo.role} | {userInfo.cabang}
                        </span>
                    </div>
                )}
                
                {/* KANAN: Tombol Aksi */}
                <div className="flex items-center gap-2 relative z-10">
                    <Button variant="outline" onClick={() => setLogoutDialogOpen(true)} className="bg-black/10 hover:bg-white hover:text-red-700 text-white border-white/30 transition-all shadow-sm backdrop-blur-sm h-9 px-3 md:px-4">
                        <LogOut className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Logout</span>
                    </Button>
                </div>
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

                    const CardContentArea = (
                    <Card className="h-full flex flex-col p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-red-400 cursor-pointer bg-white group">
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