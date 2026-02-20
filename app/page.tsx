"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Info } from 'lucide-react';

export default function LandingPage() {
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const handleUnavailableMenu = (e: React.MouseEvent, menuName: string) => {
        e.preventDefault();
        setAlertMessage(`Halaman ${menuName} belum tersedia saat ini.`);
        setAlertOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        
        {/* HEADER */}
        {/* Menggunakan bg-gradient dan shadow untuk meniru style asli */}
        <header className="flex flex-col md:flex-row items-center justify-center p-4 md:p-6 bg-linear-to-br from-red-600 to-red-800 text-white border-b border-red-900 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-center w-full max-w-6xl relative">
            <div className="hidden md:block absolute left-0 animate-in slide-in-from-left-12 duration-1000">
                <img src="/assets/Alfamart-Emblem.png" alt="Alfamart Logo" className="h-16 md:h-20 object-contain" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-center tracking-tight animate-in fade-in zoom-in duration-700 delay-300">
                SPARTA
            </h1>
            
            <div className="hidden md:block absolute right-0 animate-in zoom-in-50 duration-1000 delay-150">
                <img src="/assets/Building-Logo.png" alt="Building & Maintenance Logo" className="h-16 md:h-20 object-contain" />
            </div>
            </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 mt-4 md:mt-8">
            
            {/* Welcome Message */}
            <div className="text-center mb-10 md:mb-16 animate-in slide-in-from-top-8 duration-700">
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-slate-800">
                System for Property Administration, Reporting, Tracking & Approval
            </h2>
            <p className="text-base md:text-lg text-slate-500">
                Silakan pilih menu di bawah ini untuk mengakses SPARTA
            </p>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            
            {/* Card 1: Dashboard (Akan diarahkan ke halaman RAB/Dashboard nanti) */}
            <Link href="/auth" className="block h-full outline-none focus:ring-2 focus:ring-red-500 rounded-xl">
                <Card className="h-full flex flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-red-300 cursor-pointer bg-white group">
                <div className="flex justify-center items-center gap-4 mb-8 h-24 transition-transform duration-300 group-hover:scale-110">
                    <img src="/assets/worker.png" alt="Kontraktor" className="h-20 w-auto object-contain drop-shadow-sm" />
                    <img src="/assets/scientist.png" alt="SAT/PIC" className="h-20 w-auto object-contain drop-shadow-sm" />
                </div>
                <CardHeader className="p-0 mb-2">
                    <CardTitle className="text-xl md:text-2xl font-bold text-slate-800">Dashboard</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <CardDescription className="text-base text-slate-500">Login Dashboard SPARTA</CardDescription>
                </CardContent>
                </Card>
            </Link>

            {/* Card 2: User Manual */}
            <a href="#" onClick={(e) => handleUnavailableMenu(e, "User Manual")} className="block h-full outline-none focus:ring-2 focus:ring-red-500 rounded-xl">
                <Card className="h-full flex flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-red-300 cursor-pointer bg-white group">
                <div className="flex justify-center items-center mb-8 h-24 transition-transform duration-300 group-hover:scale-110">
                    <img src="/assets/book.png" alt="User Manual" className="h-24 w-auto object-contain drop-shadow-sm" />
                </div>
                <CardHeader className="p-0 mb-2">
                    <CardTitle className="text-xl md:text-2xl font-bold text-slate-800">User Manual</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <CardDescription className="text-base text-slate-500">Panduan penggunaan sistem & alur kerja</CardDescription>
                </CardContent>
                </Card>
            </a>

            {/* Card 3: Tentang SPARTA */}
            <a href="#" onClick={(e) => handleUnavailableMenu(e, "Tentang SPARTA")} className="block h-full outline-none focus:ring-2 focus:ring-red-500 rounded-xl">
                <Card className="h-full flex flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-red-300 cursor-pointer bg-white group">
                <div className="flex justify-center items-center mb-8 h-24 transition-transform duration-300 group-hover:scale-110">
                    <img src="/assets/about.png" alt="Tentang SPARTA" className="h-24 w-auto object-contain drop-shadow-sm" />
                </div>
                <CardHeader className="p-0 mb-2">
                    <CardTitle className="text-xl md:text-2xl font-bold text-slate-800">Tentang SPARTA</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <CardDescription className="text-base text-slate-500">Informasi versi dan pengembang aplikasi</CardDescription>
                </CardContent>
                </Card>
            </a>

            </div>
        </main>

        {/* MODAL / ALERT (Pengganti alert() javascript bawaan) */}
        <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
            <AlertDialogContent className="text-center rounded-2xl max-w-sm">
            <AlertDialogHeader>
                <div className="mx-auto bg-red-100 text-red-600 w-16 h-16 flex items-center justify-center rounded-full mb-4">
                <Info className="w-8 h-8" />
                </div>
                <AlertDialogTitle className="text-xl font-bold text-center">Informasi</AlertDialogTitle>
                <AlertDialogDescription className="text-center text-base text-slate-600">
                {alertMessage}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center">
                <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white px-8 rounded-lg w-full">
                Tutup
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        </div>
    );
}