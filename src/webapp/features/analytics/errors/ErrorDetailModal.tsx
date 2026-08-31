import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@components/Dialog";
import { LoadingState } from "@components/LoadingState";
import { useApps } from "@features/apps";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface ErrorDetail {
  errorId: string;
  appId: string;
  timestamp: string;
  errorMessage: string;
  errorType: string;
  stackTrace: string;
  platform: string;
  osName: string;
  osVersion: string;
  appVersion: string;
  sdkVersion: string;
  sessionId: string;
  severity: string;
  kind: string;
}

interface ErrorDetailModalProps {
  appId: string;
  errorId: string | null;
  open: boolean;
  onClose: () => void;
}

async function fetchErrorDetail(appId: string, errorId: string, buildMode: string): Promise<ErrorDetail> {
  const params = new URLSearchParams({ buildMode });
  const response = await fetch(`/api/v0/apps/${appId}/errors/${errorId}?${params}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch error details");
  }

  return response.json();
}

export function ErrorDetailModal({ appId, errorId, open, onClose }: ErrorDetailModalProps) {
  const { buildMode } = useApps();
  const [justCopied, setJustCopied] = useState(false);
  const navigate = useNavigate();

  const { data: error, isLoading } = useQuery({
    queryKey: ["error-detail", appId, buildMode, errorId],
    queryFn: () => fetchErrorDetail(appId, errorId!, buildMode),
    enabled: !!errorId && open,
  });

  const handleCopyStackTrace = () => {
    if (error?.stackTrace) {
      navigator.clipboard.writeText(error.stackTrace);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    }
  };

  const handleClickSessionId = (sessionId: string) => () => {
    const currentLocation = window.location;

    navigate(`/${appId}/live/${sessionId}`, {
      state: {
        returnTo: {
          pathname: currentLocation.pathname,
          search: currentLocation.search,
        },
      },
    });
  };

  const formatSeverity = (sev?: string) => {
    if (!sev) return "";
    const s = sev.toLowerCase();
    if (s === "fatal") return "Crítico (Fatal)";
    if (s === "error" || s === "erro") return "Erro";
    if (s === "warning" || s === "aviso" || s === "alerta") return "Alerta / Atenção";
    if (s === "info") return "Informativo";
    return sev;
  };

  const formatKind = (kind?: string) => {
    if (!kind) return "";
    const k = kind.toLowerCase();
    if (k === "handled" || k === "tratado") return "Tratado pelo App";
    if (k === "unhandled" || k === "nao_tratado") return "Não Tratado (Crash)";
    return kind;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="py-8">
            <LoadingState size="md" />
          </div>
        ) : error ? (
          <>
            <DialogHeader>
              <DialogTitle>Detalhes do Erro</DialogTitle>
              <DialogDescription>{error.errorType}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Seção de Informações do Erro */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Informações do Erro</h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-4 gap-2">
                    <span className="text-muted-foreground">Data / Hora:</span>
                    <span className="col-span-3">
                      {new Date(error.timestamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <span className="text-muted-foreground">Tipo de Erro:</span>
                    <span className="col-span-3 font-medium">{error.errorType}</span>
                  </div>
                  {error.severity && (
                    <div className="grid grid-cols-4 gap-2">
                      <span className="text-muted-foreground">Severidade:</span>
                      <span className="col-span-3 font-medium">{formatSeverity(error.severity)}</span>
                    </div>
                  )}
                  {error.kind && (
                    <div className="grid grid-cols-4 gap-2">
                      <span className="text-muted-foreground">Tratamento:</span>
                      <span className="col-span-3">{formatKind(error.kind)}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    <span className="text-muted-foreground">Mensagem:</span>
                    <span className="col-span-3 whitespace-pre-line leading-relaxed">{error.errorMessage}</span>
                  </div>
                </div>
              </div>

              {/* Seção de Dispositivo e Plataforma */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Informações do Dispositivo e Plataforma</h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-4 gap-2">
                    <span className="text-muted-foreground">Plataforma:</span>
                    <span className="col-span-3">{error.platform}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <span className="text-muted-foreground">Sistema Operacional:</span>
                    <span className="col-span-3">
                      {error.osName} {error.osVersion}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <span className="text-muted-foreground">Versão do App:</span>
                    <span className="col-span-3">{error.appVersion}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <span className="text-muted-foreground">Versão do SDK:</span>
                    <span className="col-span-3">{error.sdkVersion}</span>
                  </div>
                  {error.sessionId && (
                    <div className="grid grid-cols-4 gap-2">
                      <span className="text-muted-foreground">ID da Sessão:</span>
                      <button
                        onClick={handleClickSessionId(error.sessionId)}
                        className="col-span-3 text-left font-mono hover:underline text-primary"
                        title="Ver histórico desta sessão ao vivo"
                      >
                        {error.sessionId}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stack Trace Section */}
              {error.stackTrace && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Rastreamento da Pilha (Stack Trace)</h3>
                    <button
                      onClick={handleCopyStackTrace}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
                    >
                      {justCopied ? (
                        <>
                          <IconCheck className="h-3.5 w-3.5 text-green-500" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <IconCopy className="h-3.5 w-3.5" />
                          <span>Copiar Stack Trace</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-muted p-4 rounded text-xs overflow-x-auto font-mono whitespace-pre-wrap">
                    {error.stackTrace}
                  </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">Erro não encontrado</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
