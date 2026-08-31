import { useEffect, useState } from "react";
import { APP_VERSION } from "../version";
import { ArrowPathIcon, SparklesIcon } from "@heroicons/react/24/outline";

export function UpdateNotifier() {
  const [newVersion, setNewVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkVersion = async () => {
      try {
        const res = await fetch("/api/version?_t=" + Date.now(), { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data && data.version && data.version !== APP_VERSION && isMounted) {
            setNewVersion(data.version);
          }
        }
      } catch {
        // Ignora erros de rede temporários
      }
    };

    // Checagem inicial
    checkVersion();

    // Checagem periódica a cada 45 segundos
    const interval = setInterval(checkVersion, 45000);

    // Checagem quando o usuário volta para a aba do navegador
    const handleFocus = () => checkVersion();
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  if (!newVersion) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce duration-1000 max-w-md w-[92%] sm:w-auto">
      <div className="bg-primary/95 text-primary-foreground backdrop-blur-md px-4 py-3 rounded-xl shadow-2xl border border-primary-foreground/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <SparklesIcon className="w-5 h-5 flex-shrink-0 text-amber-300 animate-pulse" />
          <div className="text-xs sm:text-sm font-medium truncate">
            Nova versão disponível (<span className="font-bold underline">{newVersion}</span>)!
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-background text-foreground hover:bg-background/90 text-xs font-semibold rounded-lg shadow transition-all active:scale-95 flex-shrink-0 cursor-pointer"
        >
          <ArrowPathIcon className="w-3.5 h-3.5" />
          Atualizar
        </button>
      </div>
    </div>
  );
}
