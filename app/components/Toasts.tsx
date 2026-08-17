"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

// ✅ TRA-06 : notifications élégantes en remplacement des alert()
export function toast(message: string, type: "succes" | "erreur" | "info" = "info") {
  window.dispatchEvent(new CustomEvent("app:toast", { detail: { message, type } }));
}

export default function Toasts() {
  const [toasts, setToasts] = useState<any[]>([]);

  useEffect(() => {
    const onToast = (e: any) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, ...e.detail }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    };
    window.addEventListener("app:toast", onToast);
    return () => window.removeEventListener("app:toast", onToast);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 w-80 print:hidden">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 p-4 rounded-xl shadow-lg text-sm font-medium text-white ${
            t.type === "succes" ? "bg-green-600" : t.type === "erreur" ? "bg-red-600" : "bg-blue-600"
          }`}
        >
          {t.type === "succes" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> :
           t.type === "erreur" ? <XCircle className="h-5 w-5 shrink-0" /> :
           <Info className="h-5 w-5 shrink-0" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}