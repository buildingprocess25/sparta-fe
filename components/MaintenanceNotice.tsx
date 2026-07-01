"use client";

import { useEffect } from "react";
import { useGlobalAlert } from "@/context/GlobalAlertContext";
import { useSession } from "@/context/SessionContext";

const MAINTENANCE_NOTICE_DATE = "2026-07-01";
const MAINTENANCE_NOTICE_ID = "maintenance-2026-07-01-1700-wib";

const getJakartaDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export default function MaintenanceNotice() {
  const { user, isLoading } = useSession();
  const { showAlert } = useGlobalAlert();

  useEffect(() => {
    if (isLoading || !user) return;
    if (getJakartaDate() !== MAINTENANCE_NOTICE_DATE) return;

    const storageKey = `sparta_notice_${MAINTENANCE_NOTICE_ID}_${user.email}`;
    if (sessionStorage.getItem(storageKey) === "1") return;

    sessionStorage.setItem(storageKey, "1");
    showAlert({
      title: "Pemberitahuan Maintenance",
      type: "warning",
      message:
        "SPARTA akan menjalani maintenance hari ini, Rabu 1 Juli 2026, mulai pukul 17:00 WIB.",
      details:
        "Mohon simpan pekerjaan Anda sebelum pukul 17:00 WIB. Selama maintenance berlangsung, akses aplikasi dapat terganggu sementara.",
    });
  }, [isLoading, showAlert, user]);

  return null;
}
