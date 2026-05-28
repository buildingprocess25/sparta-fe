"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/context/SessionContext";
import { hasDcDevelopmentRole, hasStoreWorkspaceRole } from "@/lib/constants";

const WORKSPACE_STORAGE_KEY = "activeWorkspace";

export default function WorkspacePage() {
  const router = useRouter();
  const { user, isLoading } = useSession();

  const canOpenDc = hasDcDevelopmentRole(user?.roles);
  const canOpenStore = hasStoreWorkspaceRole(user?.roles);

  useEffect(() => {
    if (isLoading || !user) return;

    if (canOpenDc && !canOpenStore) {
      sessionStorage.setItem(WORKSPACE_STORAGE_KEY, "dc");
      router.replace("/dc-development");
      return;
    }

    if (canOpenStore && !canOpenDc) {
      sessionStorage.setItem(WORKSPACE_STORAGE_KEY, "store");
      router.replace("/dashboard");
    }
  }, [canOpenDc, canOpenStore, isLoading, router, user]);

  const openWorkspace = (workspace: "dc" | "store") => {
    sessionStorage.setItem(WORKSPACE_STORAGE_KEY, workspace);
    router.push(workspace === "dc" ? "/dc-development" : "/dashboard");
  };

  if (isLoading || !user) {
    return (
      <main className="min-h-screen bg-slate-950 text-white grid place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef3f7] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-600">SPARTA Building</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Pilih Workspace</h1>
          </div>
          <img src="/assets/Alfamart-Emblem.png" alt="Alfamart" className="h-12 w-auto object-contain" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {canOpenStore && (
            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <Store className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-950">Toko / SPARTA Building</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <p className="text-sm text-slate-500">{user.cabang || "Workspace operasional toko"}</p>
                <Button onClick={() => openWorkspace("store")} className="rounded-lg bg-slate-950 text-white hover:bg-slate-800">
                  Masuk
                </Button>
              </CardContent>
            </Card>
          )}

          {canOpenDc && (
            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Building2 className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-950">DC Development</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <p className="text-sm text-slate-500">{user.roles.join(", ")}</p>
                <Button onClick={() => openWorkspace("dc")} className="rounded-lg bg-blue-700 text-white hover:bg-blue-800">
                  Masuk
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
