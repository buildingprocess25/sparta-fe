"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGlobalAlert } from "@/context/GlobalAlertContext";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function GlobalAlert() {
  const { alertState, closeAlert } = useGlobalAlert();
  const { isOpen, title, message, type, onConfirm, confirmMode, onCancel, confirmText, cancelText } = alertState;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-10 h-10 text-emerald-600" />;
      case "error":
        return <XCircle className="w-10 h-10 text-rose-600" />;
      case "warning":
        return <AlertTriangle className="w-10 h-10 text-amber-600" />;
      case "info":
      default:
        return <Info className="w-10 h-10 text-blue-600" />;
    }
  };

  const getThemeClass = () => {
    switch (type) {
      case "success":
        return "bg-emerald-50 border-emerald-100";
      case "error":
        return "bg-rose-50 border-rose-100";
      case "warning":
        return "bg-amber-50 border-amber-100";
      case "info":
      default:
        return "bg-blue-50 border-blue-100";
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 text-white";
      case "error":
        return "bg-rose-600 hover:bg-rose-700 text-white";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white";
      case "info":
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white";
    }
  };

  // For notification mode (no confirmMode), clicking OK fires onConfirm then closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (!confirmMode) {
        // Original behavior: closing the dialog triggers onConfirm
        closeAlert();
        if (onConfirm) onConfirm();
      } else {
        // Confirmation mode: closing via overlay/escape = cancel
        closeAlert();
        if (onCancel) onCancel();
      }
    }
  };

  const handleConfirm = () => {
    closeAlert();
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    closeAlert();
    if (onCancel) onCancel();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-100 rounded-3xl border-0 shadow-2xl p-0 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={cn("p-8 flex flex-col items-center text-center gap-4", getThemeClass())}>
          <div className="bg-white/80 p-4 rounded-full shadow-sm">
            {getIcon()}
          </div>
          <div className="space-y-2">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-extrabold text-slate-800 leading-tight">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-600 font-medium text-sm">
                {message}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
        </div>
        <AlertDialogFooter className={cn("p-4 bg-white/50 backdrop-blur-sm", confirmMode ? "sm:justify-center gap-3" : "sm:justify-center")}>
          {confirmMode ? (
            <>
              <AlertDialogCancel
                onClick={handleCancel}
                className="flex-1 h-12 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95 border-slate-200 hover:bg-slate-100 text-slate-700"
              >
                {cancelText}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className={cn("flex-1 h-12 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95 shadow-md", getButtonClass())}
              >
                {confirmText}
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction
              className={cn("w-full h-12 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95 shadow-md", getButtonClass())}
            >
              Selesai
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
