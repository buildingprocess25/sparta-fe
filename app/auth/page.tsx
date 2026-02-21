"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';

const APPS_SCRIPT_POST_URL = "https://script.google.com/macros/s/AKfycbzPubDTa7E2gT5HeVLv9edAcn1xaTiT3J4BtAVYqaqiFAvFtp1qovTXpqpm-VuNOxQJ/exec";
const PYTHON_API_LOGIN_URL = "https://sparta-backend-5hdj.onrender.com/api/login";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Fungsi untuk logging ke Google Apps Script
  const logLoginAttempt = async (username: string, cabang: string, status: string) => {
    const logData = {
      requestType: "loginAttempt",
      username: username,
      cabang: cabang,
      status: status,
    };

    try {
      await fetch(APPS_SCRIPT_POST_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(logData),
      });
    } catch (error) {
      console.error("Failed to log login attempt:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: "Logging in...", type: "info" });

    try {
      // Kirim request ke backend Python
      const response = await fetch(PYTHON_API_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, cabang: password }),
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        // Log keberhasilan (fire and forget)
        logLoginAttempt(email, password, "Success");

        const userRole = (result.role || "").toUpperCase();
        
        setMessage({ text: "Login berhasil! Mengalihkan...", type: "success" });

        // Simpan ke sessionStorage
        sessionStorage.setItem("authenticated", "true");
        sessionStorage.setItem("loggedInUserEmail", email);
        sessionStorage.setItem("userRole", userRole); 
        sessionStorage.setItem("loggedInUserCabang", password); 

        // Redirect ke dashboard menggunakan Next.js Router
        setTimeout(() => {
          router.push("/dashboard"); // Pastikan folder app/dashboard/page.tsx sudah ada nanti
        }, 900);

      } else {
        // Handle gagal login sesuai logika script.js lama
        const errorMessage = result.message ? result.message.toLowerCase() : "";
        let errorText = result.message || "Login gagal!";

        if (errorMessage.includes("not found") || errorMessage.includes("tidak ditemukan")) {
          errorText = "User belum terdaftar";
        } else if (errorMessage.includes("invalid") || errorMessage.includes("salah") || errorMessage.includes("incorrect")) {
          errorText = "Email atau password salah";
        }

        setMessage({ text: errorText, type: "error" });
        logLoginAttempt(email, password, "Failed");
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      logLoginAttempt(email, password, "Failed");
      setMessage({ text: "Gagal terhubung ke server. Silakan coba lagi.", type: "error" });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <Card className="w-full max-w-100 p-2 md:p-4 shadow-xl border-0 md:border md:border-slate-200">
        <CardHeader className="relative pb-2 text-center">
          {/* Tombol Kembali */}
          <Link 
            href="/" 
            className="absolute left-6 top-6 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali</span>
          </Link>
          
          <div className="flex flex-col items-center mt-6">
            <img 
              src="/assets/Alfamart-Emblem.png" 
              alt="Logo Alfamart" 
              className="h-12 mb-4 object-contain"
            />
            <CardTitle className="text-xl md:text-2xl font-bold text-slate-800">
              Building & Maintenance
            </CardTitle>
            <h3 className="mt-2 text-base font-semibold text-slate-600">Login</h3>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5 mt-4">
            {/* Input Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-600 font-medium">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Masukkan email Anda" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-600 font-medium">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Masukkan kata sandi Anda" 
                  required 
                  value={password}
                  // Memaksa input menjadi huruf besar (UPPERCASE) persis seperti script.js Anda
                  onChange={(e) => setPassword(e.target.value.toUpperCase())}
                  className="h-11 pr-10 tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Tombol Submit - Memakai warna primary biru Alfamart berdasarkan style.css Anda */}
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-11 text-base font-semibold bg-[#005a9e] hover:bg-[#004a80] transition-transform active:scale-[0.98]"
            >
              {isLoading ? "Memproses..." : "Login"}
            </Button>

            {/* Pesan Alert */}
            {message.text && (
              <p className={`text-center text-sm font-medium mt-4 p-2 rounded-md ${
                message.type === 'success' ? 'bg-green-100 text-green-700' : 
                message.type === 'error' ? 'bg-red-100 text-red-600' : 
                'bg-blue-50 text-blue-600'
              }`}>
                {message.text}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}