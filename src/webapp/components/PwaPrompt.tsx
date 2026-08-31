import { Button } from "@components/Button";
import { IconDeviceMobile, IconRefresh, IconX, IconSparkles } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { APP_VERSION } from "../version";

export function PwaPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissedInstall, setDismissedInstall] = useState(false);

  useEffect(() => {
    // 1. Captura evento de instalação PWA nativo (Android, iOS, PC, Mac, Linux)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 2. Detector e Verificador Automático via API /api/version
    const checkApiVersion = async () => {
      try {
        const res = await fetch("/api/version?_t=" + Date.now(), { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data && data.version && data.version !== APP_VERSION) {
            setUpdateAvailable(true);
          }
        }
      } catch {}
    };

    checkApiVersion();
    const apiInterval = setInterval(checkApiVersion, 45000);
    const handleFocus = () => checkApiVersion();
    window.addEventListener("focus", handleFocus);

    // 3. Detector e Verificador Automático do Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Checa imediatamente se já há um worker esperando
        if (registration.waiting) {
          setUpdateAvailable(true);
          setWaitingWorker(registration.waiting);
        }

        // Checa por atualizações a cada 60 segundos em segundo plano
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60000);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                setWaitingWorker(newWorker);
              }
            });
          }
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("focus", handleFocus);
      clearInterval(apiInterval);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  const handleUpdateClick = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  };

  return (
    <>
      {/* Notificação Flutuante de Nova Versão Disponível com Botão Atualizar */}
      {updateAvailable && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl border border-indigo-400/30 animate-bounce">
          <IconSparkles className="h-5 w-5 animate-pulse text-amber-300" />
          <div className="text-sm font-semibold">
            Nova versão disponível do Aptabase!
          </div>
          <Button size="sm" variant="secondary" onClick={handleUpdateClick} className="ml-2 shadow font-bold text-indigo-950 bg-white hover:bg-slate-100">
            Atualizar agora
          </Button>
        </div>
      )}

      {/* Banner de Instalação do PWA Nativo */}
      {installPrompt && !dismissedInstall && !updateAvailable && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center justify-between gap-4 bg-card text-card-foreground p-3.5 rounded-xl shadow-2xl border border-primary/20 max-w-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
              <IconDeviceMobile className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Instalar Aplicativo</p>
              <p className="text-xs text-muted-foreground">Instale o PWA para navegação rápida e sem abas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleInstallClick} className="font-semibold">
              Instalar
            </Button>
            <button
              type="button"
              onClick={() => setDismissedInstall(true)}
              className="text-muted-foreground hover:text-foreground p-1 rounded"
              title="Fechar"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
