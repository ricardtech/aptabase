import { formatNumber } from "@fns/format-number";
import { IconArrowDown, IconUserMinus, IconUsers } from "@tabler/icons-react";

export type FunnelStepData = {
  stepIndex: number;
  eventName: string;
  usersCount: number;
  conversionFromFirst: number;
  conversionFromPrevious: number;
  dropOffRate: number;
};

type Props = {
  stepsData: FunnelStepData[];
};

export function FunnelChart({ stepsData }: Props) {
  if (stepsData.length === 0) {
    return null;
  }

  // Gradientes de cores por etapa do funil (do azul até esmeralda)
  const colors = [
    "from-blue-600 to-indigo-600",
    "from-indigo-600 to-violet-600",
    "from-violet-600 to-purple-600",
    "from-purple-600 to-fuchsia-600",
    "from-fuchsia-600 to-pink-600",
    "from-pink-600 to-rose-600",
  ];

  return (
    <div className="space-y-6">
      {/* Visualização em Barras do Funil */}
      <div className="rounded-xl border border-border bg-card/60 p-5 backdrop-blur-sm shadow-sm space-y-4">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <IconUsers className="h-4 w-4 text-primary" />
          Progressão de Usuários por Etapa
        </h4>

        <div className="space-y-3 pt-2">
          {stepsData.map((step, idx) => {
            const isFirst = idx === 0;
            const barWidth = Math.max(12, Math.min(100, step.conversionFromFirst));
            const gradientColor = colors[idx % colors.length];

            return (
              <div key={step.eventName} className="space-y-2">
                {/* Conector de Abandono entre etapas */}
                {!isFirst && (
                  <div className="flex items-center gap-3 pl-6 py-1 text-xs">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                      <IconArrowDown className="h-3 w-3" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {step.conversionFromPrevious.toFixed(1)}% continuaram
                    </span>
                    {step.dropOffRate > 0 && (
                      <span className="flex items-center gap-1 text-rose-500 font-medium">
                        <IconUserMinus className="h-3 w-3" />
                        -{step.dropOffRate.toFixed(1)}% abandonaram aqui
                      </span>
                    )}
                  </div>
                )}

                {/* Barra da Etapa */}
                <div className="relative rounded-lg bg-secondary/40 p-3 transition-all hover:bg-secondary/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2 z-10 relative">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                        {step.stepIndex}
                      </span>
                      <span className="font-semibold text-sm text-foreground">
                        {step.eventName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono font-bold text-sm text-foreground">
                        {formatNumber(step.usersCount)}{" "}
                        <span className="text-xs font-normal text-muted-foreground">usuários</span>
                      </span>
                      <span className="rounded-md bg-background px-2 py-0.5 font-mono font-semibold text-primary border border-border">
                        {step.conversionFromFirst.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso com Gradiente */}
                  <div className="h-3 w-full rounded-full bg-background/80 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${gradientColor} transition-all duration-1000 shadow-sm`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela Detalhada com os Dados de Conversão */}
      <div className="rounded-xl border border-border bg-card/60 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-secondary/20">
          <h4 className="text-sm font-semibold text-foreground">Detalhamento Numérico do Funil</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Etapa</th>
                <th className="py-2.5 px-4 font-semibold">Evento</th>
                <th className="py-2.5 px-4 font-semibold text-right">Usuários Únicos</th>
                <th className="py-2.5 px-4 font-semibold text-right">Conversão da Etapa</th>
                <th className="py-2.5 px-4 font-semibold text-right">Taxa de Abandono</th>
                <th className="py-2.5 px-4 font-semibold text-right">Conversão Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {stepsData.map((step) => (
                <tr key={step.eventName} className="hover:bg-secondary/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-muted-foreground">
                    #{step.stepIndex}
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">{step.eventName}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">
                    {formatNumber(step.usersCount)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    <span className="text-emerald-500 font-medium">
                      {step.stepIndex === 1 ? "100%" : `${step.conversionFromPrevious.toFixed(1)}%`}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {step.dropOffRate > 0 ? (
                      <span className="text-rose-500 font-medium">
                        -{step.dropOffRate.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0.0%</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-primary">
                    {step.conversionFromFirst.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
