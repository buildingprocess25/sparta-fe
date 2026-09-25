"use client";
import { useEffect, useState, useRef } from "react";
import { useSession } from "@/context/SessionContext";
import { safeFetchJSON } from "@/lib/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function WebPushManager() {
  const { user } = useSession();
  const [permissionState, setPermissionState] = useState<NotificationPermission | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const hasSubscribed = useRef(false);

  useEffect(() => {
    if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    
    // Inisialisasi state dari permission browser saat ini
    const currentPermission = Notification.permission;
    setPermissionState(currentPermission);
    
    // Tampilkan banner jika belum diizinkan
    if (currentPermission === "default" || currentPermission === "denied") {
      setShowBanner(true);
    } else if (currentPermission === "granted") {
      if (!hasSubscribed.current) {
        hasSubscribed.current = true;
        subscribeToPush();
      }
    }
  }, [user?.email]);

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
         await safeFetchJSON('/api/task-notifications/web-push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: existingSubscription })
         });
         return;
      }

      const res = await safeFetchJSON('/api/task-notifications/web-push/vapid-public-key') as any;
      if (res?.data?.publicKey) {
         const publicKey = res.data.publicKey;
         const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
         });

         await safeFetchJSON('/api/task-notifications/web-push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription })
         });
      }
    } catch (err) {
      console.error("Web Push Error:", err);
    }
  };

  const handleRequestPermission = async () => {
    if (permissionState === "denied") {
      alert("Notifikasi telah diblokir. Silakan klik ikon gembok di sebelah URL (Address Bar) dan ubah izin 'Notifikasi' menjadi 'Allow' atau 'Izinkan', lalu refresh halaman.");
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      if (permission === 'granted') {
        setShowBanner(false);
        await subscribeToPush();
      }
    } catch (err) {
      console.error("Error requesting permission:", err);
    }
  };

  if (!showBanner || !user) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-4 z-[9999] flex items-start space-x-4 animate-in slide-in-from-bottom-5">
      <div className="bg-red-50 p-2 rounded-full flex-shrink-0 mt-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 animate-pulse">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 text-sm">Aktifkan Notifikasi</h3>
        <p className="text-xs text-gray-500 mt-1 mb-3 leading-relaxed">
          {permissionState === 'denied' 
            ? 'Browser Anda saat ini memblokir notifikasi SPARTA. Anda mungkin akan melewatkan info tugas.'
            : 'Izinkan SPARTA untuk mengirimkan pemberitahuan tugas yang membutuhkan aksi Anda.'}
        </p>
        <div className="flex space-x-2">
          <button 
            onClick={handleRequestPermission}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
          >
            {permissionState === 'denied' ? 'Cara Mengizinkan' : 'Izinkan Sekarang'}
          </button>
          <button 
            onClick={() => setShowBanner(false)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium py-2 px-3 rounded-lg transition-colors"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
}
