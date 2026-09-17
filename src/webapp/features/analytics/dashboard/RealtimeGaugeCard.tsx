import { PingSignal } from "@components/PingSignal";
import { formatNumber } from "@fns/format-number";
import { useApps } from "@features/apps";
import { IconArrowRight, IconBroadcast, IconFlame } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { liveGeoDataPoints, liveRecentSessions } from "../query";

type Props = {
  appId: string;
  className?: string;
};

export function RealtimeGaugeCard({ appId, className = "" }: Props) {
  const { buildMode } = useApps();

  // Polling automático a cada 10 segundos em tempo real
  const { data: geoPoints, isLoading: isLoadingGeo } = useQuery({
    queryKey: ["live-geo-gauge", appId, buildMode],
    queryFn: () => liveGeoDataPoints({ appId, buildMode }),
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const { data: recentSessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["live-sessions-gauge", appId, buildMode],
    queryFn: () => liveRecentSessions({ appId, buildMode }),
    refetchInterval: 10000,
    staleTime: 5000,
  });

  // Cálculos consolidados em tempo real
  const totalUsers = useMemo(() => {
    if (!geoPoints || geoPoints.length === 0) return 0;
    return geoPoints.reduce((acc, point) => acc + (point.users || 0), 0);
  }, [geoPoints]);

  const activeSessionsCount = useMemo(() => {
    return recentSessions?.length ?? 0;
  }, [recentSessions]);

  const recentEventsCount = useMemo(() => {
    if (!recentSessions || recentSessions.length === 0) return 0;
    return recentSessions.reduce((acc, s) => acc + (s.eventsCount || 0), 0);
  }, [recentSessions]);

  // Escala dinâmica adaptativa para o velocímetro
  const maxCapacity = useMemo(() => {
    if (totalUsers <= 5) return 10;
    if (totalUsers <= 25) return 50;
    if (totalUsers <= 75) return 100;
    if (totalUsers <= 350) return 500;
    if (totalUsers <= 750) return 1000;
    return Math.ceil(totalUsers * 1.5);
  }, [totalUsers]);

  // Ângulo do ponteiro e preenchimento do arco (-90 a 90 graus)
  const percentage = Math.min(100, Math.max(0, (totalUsers / maxCapacity) * 100));
  const angleDegrees = -90 + (percentage / 100) * 180;

  // Parâmetros do arco SVG
  const radius = 80;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Apenas o semicírculo superior
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const isLoading = isLoadingGeo && isLoadingSessions;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border/80 bg-card/60 p-5 backdrop-blur-md shadow-sm transition-all hover:border-border hover:shadow-md ${className}`}
    >
      {/* Luz ambiente sutil de fundo */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconBroadcast className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Usuários no Momento
            </h3>
            <p className="text-xs text-muted-foreground">Tempo real nos últimos minutos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500 border border-emerald-500/20">
            <PingSignal color="success" size="xs" />
            Ao Vivo
          </span>
          <Link
            to={`/${appId}/liveview`}
            className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
            title="Abrir Visualização ao Vivo completa"
          >
            <span>Mapa</span>
            <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Área do Velocímetro / Gauge */}
      <div className="flex flex-col items-center justify-center pt-4 pb-2">
        <div className="relative flex h-36 w-64 items-center justify-center overflow-hidden">
          <svg className="h-48 w-64 -rotate-180 transform" viewBox="0 0 200 120">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="60%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* Arco de fundo (trilha) */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="text-muted/30"
            />

            {/* Arco de progresso colorido */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </svg>

          {/* Ponteiro estilizado */}
          <div
            className="absolute bottom-4 left-1/2 h-20 w-1 origin-bottom -translate-x-1/2 transition-transform duration-1000 ease-out"
            style={{
              transform: `translateX(-50%) rotate(${angleDegrees}deg)`,
            }}
          >
            <div className="h-full w-full rounded-full bg-gradient-to-t from-transparent via-foreground/60 to-foreground shadow-sm" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background shadow-md" />
          </div>

          {/* Base central do ponteiro */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="h-4 w-4 rounded-full bg-foreground border-2 border-background shadow-md" />
          </div>

          {/* Valores mínimo e máximo na base */}
          <span className="absolute bottom-1 left-4 text-[11px] font-mono text-muted-foreground">
            0
          </span>
          <span className="absolute bottom-1 right-4 text-[11px] font-mono text-muted-foreground">
            {formatNumber(maxCapacity)}
          </span>
        </div>

        {/* Display do Número Central */}
        <div className="text-center -mt-3">
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-4xl font-extrabold tracking-tight text-foreground font-sans">
              {isLoading ? "..." : formatNumber(totalUsers)}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {totalUsers === 1 ? "ativo" : "ativos"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalUsers === 0
              ? "Aguardando novas conexões no momento"
              : totalUsers === 1
              ? "1 pessoa interagindo com o aplicativo"
              : `${formatNumber(totalUsers)} pessoas interagindo com o aplicativo`}
          </p>
        </div>
      </div>

      {/* Mini Métricas Complementares (Estilo Amplitude) */}
      <div className="grid grid-cols-2 gap-3 mt-4 border-t border-border/40 pt-3">
        {/* Sessões Ativas */}
        <div className="rounded-lg bg-secondary/40 p-2.5 transition-colors hover:bg-secondary/60">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-medium">Sessões Ativas</span>
            <span className="font-mono font-semibold text-foreground">
              {isLoading ? "-" : activeSessionsCount}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-background overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(8, (activeSessionsCount / Math.max(1, maxCapacity)) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Eventos Recentes */}
        <div className="rounded-lg bg-secondary/40 p-2.5 transition-colors hover:bg-secondary/60">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-medium flex items-center gap-1">
              <IconFlame className="h-3 w-3 text-amber-500" />
              Eventos Recentes
            </span>
            <span className="font-mono font-semibold text-foreground">
              {isLoading ? "-" : formatNumber(recentEventsCount)}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-background overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(8, (recentEventsCount / Math.max(1, maxCapacity * 5)) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
