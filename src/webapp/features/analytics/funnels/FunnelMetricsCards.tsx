import { formatNumber } from "@fns/format-number";
import { IconAlertTriangle, IconCheck, IconPercentage, IconUsers } from "@tabler/icons-react";

type Props = {
  totalStarted: number;
  totalCompleted: number;
  overallRate: number;
  biggestDropStep?: {
    stepName: string;
    dropRate: number;
  } | null;
};

export function FunnelMetricsCards({
  totalStarted,
  totalCompleted,
  overallRate,
  biggestDropStep,
}: Props) {
  const rateColor =
    overallRate >= 50
      ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
      : overallRate >= 20
      ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
      : "text-rose-500 bg-rose-500/10 border-rose-500/20";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Taxa Geral de Conversão */}
      <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Taxa Geral de Conversão</span>
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${rateColor}`}>
            <IconPercentage className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {overallRate.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">do 1º ao último passo</span>
        </div>
      </div>

      {/* Entradas no Funil */}
      <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Entradas no Funil</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <IconUsers className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {formatNumber(totalStarted)}
          </span>
          <span className="text-xs text-muted-foreground">iniciaram o fluxo</span>
        </div>
      </div>

      {/* Conclusões do Funil */}
      <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Fluxos Concluídos</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <IconCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {formatNumber(totalCompleted)}
          </span>
          <span className="text-xs text-muted-foreground">atingiram a meta final</span>
        </div>
      </div>

      {/* Maior Ponto de Abandono */}
      <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Maior Abandono</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <IconAlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          {biggestDropStep ? (
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-rose-500">
                  -{biggestDropStep.dropRate.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">de desistência</span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5" title={biggestDropStep.stepName}>
                em: <strong className="text-foreground">{biggestDropStep.stepName}</strong>
              </p>
            </div>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">Nenhum abandono</span>
          )}
        </div>
      </div>
    </div>
  );
}
