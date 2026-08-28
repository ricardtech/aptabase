import { Button } from "@components/Button";
import { IconDeviceMobile, IconRefresh, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export function PwaPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissedInstall, setDismissedInstall] = useState(false);

  useEffect(() => {
    // 1. Captura evento de instalação PWA
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 2. Detector de atualização do Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
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

      // Recarrega quando novo service worker assumir o controle
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
      {/* Notificação de Nova Versão Disponível */}
      {updateAvailable && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-xl border border-primary/20 animate-bounce">
          <IconRefresh className="h-5 w-5 animate-spin" />
          <div className="text-sm font-medium">
            Nova versão disponível!
          </div>
          <Button size="sm" variant="secondary" onClick={handleUpdateClick} className="ml-2">
            Atualizar agora
          </Button>
        </div>
      )}

      {/* Banner de Instalação do PWA */}
      {installPrompt && !dismissedInstall && !updateAvailable && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center justify-between gap-3 bg-card text-card-foreground p-3 sm:px-4 sm:py-3 rounded-lg shadow-lg border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-md">
              <IconDeviceMobile className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Instalar Aplicativo</p>
              <p className="text-xs text-muted-foreground">Instale na tela de início para acesso rápido</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" onClick={handleInstallClick}>
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
