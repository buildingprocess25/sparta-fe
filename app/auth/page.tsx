"use client"

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, ChevronLeft, Info, Briefcase, MapPin, Building2, User } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Import base URL dari constants
import {
  API_URL,
  ENERGY_SYSTEM_MANAGER_ROLE,
  GENERAL_MANAGER_ROLE,
  REGIONAL_MANAGER_ROLE,
  STORE_BRANCH_CONTROLLING_ROLE,
  DIRECTOR_CONTRACTOR_ROLE,
} from '@/lib/constants';
import { storeApiAuthSession } from '@/lib/api';

// URL Google Apps Script tetap di sini karena spesifik hanya untuk file ini (logging)
const APPS_SCRIPT_POST_URL = "https://script.google.com/macros/s/AKfycbzPubDTa7E2gT5HeVLv9edAcn1xaTiT3J4BtAVYqaqiFAvFtp1qovTXpqpm-VuNOxQJ/exec";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpLoginData, setOtpLoginData] = useState<{ email: string; cabang: string; user_cabang_id?: number } | null>(null);

  // Modal untuk multi-role
  const [roleSelectOpen, setRoleSelectOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [pendingLoginData, setPendingLoginData] = useState<any>(null);

  useEffect(() => {
    const expiredMessage = sessionStorage.getItem("sessionExpiredMessage");
    if (expiredMessage) {
      setMessage({ text: expiredMessage, type: "error" });
      sessionStorage.removeItem("sessionExpiredMessage");
    }
  }, []);

  const searchParams = useSearchParams();

  useEffect(() => {
    const ssoPayload = searchParams.get("sso_payload");
    const ssoError = searchParams.get("error");
    
    if (ssoError) {
      setMessage({ text: "Gagal masuk via SSO. Silakan coba lagi.", type: "error" });
    } else if (ssoPayload) {
      handleSsoResolve(ssoPayload);
    }
  }, [searchParams]);

  const handleSsoResolve = async (payload: string) => {
    setIsLoading(true);
    setMessage({ text: "Memproses SSO...", type: "info" });
    try {
      const cleanBaseUrl = API_URL.replace(/\/$/, "");
      const resolveEndpoint = `${cleanBaseUrl}/api/auth/sso/resolve`;

      const response = await fetch(resolveEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result?.data?.requires_account_selection) {
          // fallbackEmail dan fallbackCabang tidak diperlukan karena user akan memilih dari array yang dikembalikan
          setAvailableRoles(result.data.available_roles || result.data.accounts || []);
          setPendingLoginData({ email: "", cabang: "", is_sso: true, sso_payload: payload });
          setIsLoading(false);
          setRoleSelectOpen(true);
          return;
        }

        const fallbackEmail = result?.data?.email_sat || "";
        const fallbackCabang = result?.data?.cabang || "";
        await processLoginSuccess(result, fallbackEmail, fallbackCabang);
      } else {
        setMessage({ text: result.message || "Gagal masuk via SSO", type: "error" });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("SSO resolve error", error);
      setMessage({ text: "Gagal terhubung ke server", type: "error" });
      setIsLoading(false);
    }
  };


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

  const normalizeJabatanRole = (jabatan: string) => {
    const upper = String(jabatan || "").toUpperCase().trim();
    if (upper.includes("DC BUILDING") && upper.includes("DEVELOPMENT") && upper.includes("MANAGER")) return "DC BUILDING & DEVELOPMENT MANAGER";
    if (upper.includes("DC BUILDING") && upper.includes("DEVELOPMENT") && upper.includes("SPECIALIST")) return "DC BUILDING & DEVELOPMENT SPECIALIST";
    if (upper.includes("BUILDING") && upper.includes("DEVELOPMENT") && upper.includes("GENERAL MANAGER")) return "BUILDING & DEVELOPMENT GENERAL MANAGER";
    if (upper.includes("LOCATION") && upper.includes("DEVELOPMENT") && upper.includes("GENERAL MANAGER")) return "LOCATION & DEVELOPMENT GENERAL MANAGER";
    if (upper.includes("PROPERTY") && upper.includes("DEVELOPMENT") && upper.includes("DIRECTOR")) return "PROPERTY DEVELOPMENT DIRECTOR";
    if (upper.includes("SOIL") && upper.includes("INVESTIGATION")) return "KONSULTAN SOIL INVESTIGATION";
    if (upper.includes("KONSULTAN") && upper.includes("PERENCANA")) return "KONSULTAN PERENCANA";
    if ((upper.includes("KONSULTAN") && upper.includes("PENGAWAS") && upper.includes("DC")) || upper === "MK DC") return "KONSULTAN PENGAWAS DC";
    if (upper.includes("PROJECT PLANNING") && upper.includes("MANAGER")) return "PROJECT PLANNING & DEVELOPMENT MANAGER";
    if (upper.includes("PP MANAGER")) return "PROJECT PLANNING & DEVELOPMENT MANAGER";
    if (upper.includes("PROJECT PLANNING") || upper.includes("PP SPECIALIST")) return "PROJECT PLANNING & DEVELOPMENT SPECIALIST";
    if (upper.includes("ENERGY SYSTEM") && upper.includes("MANAGER")) return ENERGY_SYSTEM_MANAGER_ROLE;
    if (upper.includes("GENERAL MANAGER")) return GENERAL_MANAGER_ROLE;
    if (upper.includes("STORE") && upper.includes("BRANCH CONTROLLING")) return STORE_BRANCH_CONTROLLING_ROLE;
    if (upper.includes("REGIONAL") && upper.includes("MANAGER")) return REGIONAL_MANAGER_ROLE;
    if (upper.includes("BUILDING MAINTENANCE MANAGER") || upper === "BBMM") return "BRANCH BUILDING & MAINTENANCE MANAGER";
    if (upper.includes("BRANCH MANAGER") || upper === "BM") return "BRANCH MANAGER";
    if (upper.includes("DOKUMENTASI") || upper === "BBSD") return "BRANCH BUILDING SUPPORT DOKUMENTASI";
    if (upper.includes("COORDINATOR") || upper === "BBC") return "BRANCH BUILDING COORDINATOR";
    if (upper.includes("SUPPORT") || upper === "BBS") return "BRANCH BUILDING SUPPORT";
    if (upper.includes("KONTRAKTOR") && upper.includes("DIREKTUR")) return DIRECTOR_CONTRACTOR_ROLE;
    if (upper.includes("KONTRAKTOR") && upper.includes("DC")) return "KONTRAKTOR DC";
    if (upper.includes("KONTRAKTOR")) return "KONTRAKTOR";
    if (upper.includes("DIREKTUR")) return DIRECTOR_CONTRACTOR_ROLE;
    return upper;
  };

  const processLoginSuccess = async (result: any, fallbackEmail: string, fallbackCabang: string) => {
    if (result?.data?.requires_account_selection) {
      setAvailableRoles(result.data.available_roles || result.data.accounts || []);
      setPendingLoginData({ email: fallbackEmail, cabang: fallbackCabang });
      setIsLoading(false);
      setRoleSelectOpen(true);
      return;
    }

    storeApiAuthSession(result?.data);

    const jabatanFromAPI = String(result?.data?.jabatan || "").toUpperCase().trim();
    const namaLengkapFromAPI = (result?.data?.nama_lengkap || "").trim();
    const cabangFromAPI = (result?.data?.cabang || fallbackCabang).trim();
    const emailFromAPI = (result?.data?.email_sat || fallbackEmail).trim();
    const namaPtFromAPI = (result?.data?.nama_pt || "").trim();
    const coverageFromAPI = Array.isArray(result?.data?.coverage) ? result.data.coverage : [];

    let mappedRole = normalizeJabatanRole(jabatanFromAPI);
    let sessionCabang = cabangFromAPI;
    let sessionNamaPt = namaPtFromAPI;
    let sessionAlamatCabang = result?.data?.alamat_cabang || "";

    sessionStorage.setItem("nama_lengkap", namaLengkapFromAPI);
    sessionStorage.setItem("userRole", mappedRole);

    setMessage({ text: "Login berhasil! Mengalihkan...", type: "success" });

    sessionStorage.setItem("authenticated", "true");
    sessionStorage.setItem("loggedInUserEmail", emailFromAPI);
    sessionStorage.setItem("loggedInUserCabang", sessionCabang);
    sessionStorage.setItem("nama_pt", sessionNamaPt);
    sessionStorage.setItem("alamat_cabang", sessionAlamatCabang);
    sessionStorage.setItem("branchCoverage", JSON.stringify(coverageFromAPI));

    setIsLoading(false);
    setTimeout(() => {
      router.push("/workspace");
    }, 900);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // JIKA ADA SESI MAINTENANCE, KECUALI HEAD OFFICE //
    // if (password.trim().toUpperCase() !== "HEAD OFFICE") {
    //   setAlertMessage("Mohon maaf, sistem sedang dalam masa maintenance. Silakan coba beberapa saat lagi.");
    //   setAlertOpen(true);
    //   return;
    // }
    // SESI MAINTENANCE //

    setIsLoading(true);
    setMessage({ text: "Logging in...", type: "info" });

    try {
      const cleanBaseUrl = API_URL.replace(/\/$/, "");
      const loginEndpoint = `${cleanBaseUrl}/api/auth/login`;

      const response = await fetch(loginEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_sat: email, cabang: password }),
      });

      const result = await response.json();

      if (response.ok) {
        logLoginAttempt(email, password, "Success");

        if (result?.data?.requires_otp) {
          setOtpToken(result.data.otp_token || "");
          setOtpLoginData({
            email: result?.data?.email_sat || email,
            cabang: result?.data?.cabang || password,
            user_cabang_id: result?.data?.user_cabang_id
          });
          setOtpCode("");
          setOtpError("");
          setOtpOpen(true);
          setIsLoading(false);
          setMessage({ text: "OTP sudah dikirim ke email Anda.", type: "info" });
          return;
        }

        await processLoginSuccess(result, email, password);
      } else {
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

  const handleVerifyOtp = async () => {
    if (!otpLoginData) return;

    setOtpLoading(true);
    setOtpError("");

    try {
      const cleanBaseUrl = API_URL.replace(/\/$/, "");
      const verifyEndpoint = `${cleanBaseUrl}/api/auth/verify-otp`;

      const response = await fetch(verifyEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_sat: otpLoginData.email,
          cabang: otpLoginData.cabang,
          user_cabang_id: otpLoginData.user_cabang_id,
          otp_token: otpToken,
          otp_code: otpCode
        })
      });

      const result = await response.json();

      if (response.ok) {
        setOtpOpen(false);
        setOtpCode("");
        setOtpToken("");
        setOtpLoginData(null);
        setOtpLoading(false);
        await processLoginSuccess(result, otpLoginData.email, otpLoginData.cabang);
        return;
      }

      setOtpError(result.message || "OTP tidak valid.");
      setOtpLoading(false);
    } catch (error) {
      console.error(error);
      setOtpError("Gagal verifikasi OTP. Silakan coba lagi.");
      setOtpLoading(false);
    }
  };

  const handleSelectAccount = async (role: any) => {
    const loginEmail = pendingLoginData?.email || role?.email_sat;
    const loginCabang = pendingLoginData?.cabang || role?.cabang;

    if (!loginEmail || !loginCabang || !role?.id) {
      setMessage({ text: "Data akun tidak lengkap. Silakan login ulang.", type: "error" });
      setRoleSelectOpen(false);
      setPendingLoginData(null);
      return;
    }

    setIsLoading(true);
    setRoleSelectOpen(false);
    setMessage({ text: "Logging in...", type: "info" });
    try {
    const cleanBaseUrl = API_URL.replace(/\/$/, "");
    
    // Cek apakah dia dari SSO atau login form biasa
    const isSso = pendingLoginData?.is_sso;
    const endpoint = isSso 
        ? `${cleanBaseUrl}/api/auth/sso/resolve` 
        : `${cleanBaseUrl}/api/auth/login`;
        
    const bodyData = isSso 
        ? { payload: pendingLoginData?.sso_payload, cabang: loginCabang, user_cabang_id: role.id }
        : { email_sat: loginEmail, cabang: loginCabang, user_cabang_id: role.id };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });
    const result = await response.json();

    if (response.ok) {
        setPendingLoginData(null);

        if (result?.data?.requires_otp) {
          setOtpToken(result.data.otp_token || "");
          setOtpLoginData({
            email: result?.data?.email_sat || pendingLoginData.email,
            cabang: result?.data?.cabang || pendingLoginData.cabang,
            user_cabang_id: result?.data?.user_cabang_id || role.id
          });
          setOtpCode("");
          setOtpError("");
          setOtpOpen(true);
          setIsLoading(false);
          setMessage({ text: "OTP sudah dikirim ke email Anda.", type: "info" });
          return;
        }

        await processLoginSuccess(result, pendingLoginData.email, pendingLoginData.cabang);
        return;
      }

      setMessage({ text: result.message || "Login gagal!", type: "error" });
      setIsLoading(false);
    } catch (error) {
      console.error(error);
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
              SPARTA Building
            </CardTitle>
            <h3 className="mt-2 text-base font-semibold text-slate-600">Login</h3>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-5 mt-4">
            <Button 
              type="button" 
              disabled={isLoading}
              onClick={() => {
                 const fallbackUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5173' : 'https://sparta-alfamart.web.id';
                 window.location.href = process.env.NEXT_PUBLIC_SSO_PORTAL_URL || fallbackUrl;
              }}
              className="w-full h-12 text-base font-bold bg-[#005a9e] hover:bg-[#004a80] transition-transform active:scale-[0.98] shadow-md"
            >
              {isLoading ? "Memproses..." : "Masuk via SPARTA SSO"}
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
          </div>
        </CardContent>
      </Card>

      {/* MODAL / ALERT MAINTENANCE */}
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

      {/* MODAL OTP HEAD OFFICE */}
      <AlertDialog open={otpOpen} onOpenChange={setOtpOpen}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-800">Verifikasi OTP</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600">
              Masukkan kode OTP yang dikirim ke email Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 mt-4">
            <Label htmlFor="otpCode" className="text-slate-600 font-medium">Kode OTP</Label>
            <Input
              id="otpCode"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="6 digit"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              className="h-11 tracking-widest text-center"
            />
            {otpError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md p-2">{otpError}</p>
            )}
          </div>
          <AlertDialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setOtpOpen(false)}
              disabled={otpLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleVerifyOtp}
              disabled={otpLoading || otpCode.length !== 6}
              className="bg-[#005a9e] hover:bg-[#004a80]"
            >
              {otpLoading ? "Memverifikasi..." : "Verifikasi"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL PILIH ROLE JIKA EMAIL SAMA */}
      <AlertDialog open={roleSelectOpen} onOpenChange={setRoleSelectOpen}>
        <AlertDialogContent className="rounded-2xl max-w-lg md:max-w-xl p-0 overflow-hidden border-0 shadow-2xl">
          <div className="bg-gradient-to-br from-blue-50/50 to-slate-50 p-6 md:p-8">
            <AlertDialogHeader className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 text-[#005a9e] w-10 h-10 flex items-center justify-center rounded-full shadow-sm">
                  <User className="w-5 h-5" />
                </div>
                <AlertDialogTitle className="text-xl md:text-2xl font-bold text-slate-800 text-left">Pilih Akses Anda</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-sm md:text-base text-slate-600 text-left">
                Kami menemukan beberapa hak akses yang terkait dengan email ini. Silakan pilih role untuk melanjutkan:
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 mt-4 max-h-[50vh] overflow-y-auto pr-2 pb-2 custom-scrollbar">
              <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
              `}} />
              
              {availableRoles.map((role, idx) => (
                <div 
                  key={role.id ?? `${role.email_sat}-${role.cabang}-${idx}`}
                  onClick={() => handleSelectAccount(role)}
                  className="group relative w-full flex flex-col justify-start h-auto p-4 md:p-5 bg-white border border-slate-200 rounded-xl cursor-pointer transition-all duration-300 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden"
                >
                  {/* Subtle hover gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/50 group-hover:to-transparent transition-colors duration-300 pointer-events-none" />
                  
                  <div className="relative z-10 w-full text-left flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-bold text-slate-800 text-lg group-hover:text-[#005a9e] transition-colors">{role.nama_lengkap}</div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[#005a9e]">
                        <ChevronLeft className="w-5 h-5 rotate-180" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2.5 mt-1">
                      {role.jabatan && (
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <Briefcase className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                          <span className="font-medium leading-tight">{role.jabatan}</span>
                        </div>
                      )}
                      
                      {role.nama_pt && (
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <Building2 className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                          <span className="leading-tight">{role.nama_pt}</span>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-2 text-sm text-slate-600 mt-1">
                        <MapPin className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                        <span className="text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 inline-block leading-tight shadow-sm">
                          {role.cabang || "Cabang belum terisi"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex justify-end">
              <Button 
                variant="outline" 
                className="px-6 rounded-lg font-semibold hover:bg-slate-100"
                onClick={() => {
                  setRoleSelectOpen(false);
                  setPendingLoginData(null);
                }}
              >
                Batal
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
