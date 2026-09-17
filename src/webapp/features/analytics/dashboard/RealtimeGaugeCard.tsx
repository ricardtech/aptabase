import { PingSignal } from "@components/PingSignal";
import { formatNumber } from "@fns/format-number";
import { useApps } from "@features/apps";
import {
  IconArrowRight,
  IconBroadcast,
  IconClock,
  IconFlame,
  IconMapPin,
} from "@tabler/icons-react";
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

  // Ângulo da agulha e preenchimento do arco (-90 a 90 graus)
  const percentage = Math.min(100, Math.max(0, (totalUsers / maxCapacity) * 100));
  const needleAngle = -90 + (percentage / 100) * 180;

  // Parâmetros geométricos do arco SVG (Semicírculo limpo de 180°)
  // Centro: (120, 115), Raio: 80
  const cx = 120;
  const cy = 115;
  const radius = 80;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // ~251.32px
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Ticks de escala ao longo do arco (0%, 25%, 50%, 75%, 100%)
  const ticks = useMemo(() => {
    const steps = [0, 0.25, 0.5, 0.75, 1];
    return steps.map((p) => {
      const angleRad = Math.PI * (1 - p); // de 180° a 0°
      const x1 = cx + (radius + 10) * Math.cos(angleRad);
      const y1 = cy - (radius + 10) * Math.sin(angleRad);
      const x2 = cx + (radius + 16) * Math.cos(angleRad);
      const y2 = cy - (radius + 16) * Math.sin(angleRad);
      return { p, x1, y1, x2, y2 };
    });
  }, [cx, cy, radius]);

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
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <IconBroadcast className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              Usuários no Momento
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <IconClock className="h-3 w-3" />
              Tempo real nos últimos 5 minutos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-500 border border-emerald-500/20">
            <PingSignal color="success" size="xs" />
            Ao Vivo
          </span>
          <Link
            to={`/${appId}/live`}
            className="flex items-center gap-1 rounded-md border border-border/60 bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary hover:text-primary transition-all shadow-2xs"
            title="Abrir mapa de conexões e sessões em tempo real"
          >
            <IconMapPin className="h-3.5 w-3.5 text-primary" />
            <span>Ver no Mapa</span>
            <IconArrowRight className="h-3 w-3 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Área do Velocímetro Semicircular Limpo */}
      <div className="flex flex-col items-center justify-center pt-3 pb-1">
        <div className="relative flex w-full max-w-[280px] items-center justify-center">
          <svg
            className="w-full max-w-[260px] overflow-visible"
            viewBox="0 0 240 135"
          >
            <defs>
              <linearGradient id="speedometerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <filter id="gaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Tracinhos da escala (Ticks) */}
            {ticks.map((t, idx) => (
              <line
                key={idx}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="currentColor"
                strokeWidth={idx === 0 || idx === 2 || idx === 4 ? 2 : 1.2}
                className={
                  idx === 0 || idx === 2 || idx === 4
                    ? "text-muted-foreground/60"
                    : "text-muted-foreground/30"
                }
              />
            ))}

            {/* Arco de fundo (Trilha vazia) */}
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="text-muted/30 dark:text-muted/20"
            />

            {/* Arco colorido de progresso */}
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke="url(#speedometerGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />

            {/* Agulha / Ponteiro com rotação pelo centro exato (cx, cy) */}
            <g
              transform={`rotate(${needleAngle} ${cx} ${cy})`}
              style={{
                transition: "transform 0.8s cubic-bezier(0.34, 1.3, 0.64, 1)",
              }}
            >
              {/* Corpo afilado da agulha */}
              <polygon
                points={`${cx - 2.5},${cy} ${cx + 2.5},${cy} ${cx + 1},${cy - radius + 14} ${cx - 1},${cy - radius + 14}`}
                fill="#f8fafc"
                className="dark:fill-slate-100"
                filter="url(#gaugeShadow)"
              />
              {/* Ponta colorida com destaque */}
              <circle
                cx={cx}
                cy={cy - radius + 14}
                r="3"
                fill="#38bdf8"
              />
            </g>

            {/* Pivô central metálico */}
            <circle
              cx={cx}
              cy={cy}
              r="8"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="2.5"
            />
            <circle cx={cx} cy={cy} r="3" fill="#ffffff" />

            {/* Marcadores de valor mínimo e máximo */}
            <text
              x={cx - radius}
              y={cy + 16}
              textAnchor="middle"
              className="fill-muted-foreground text-[11px] font-mono font-medium"
            >
              0
            </text>
            <text
              x={cx + radius}
              y={cy + 16}
              textAnchor="middle"
              className="fill-muted-foreground text-[11px] font-mono font-medium"
            >
              {formatNumber(maxCapacity)}
            </text>
          </svg>
        </div>

        {/* Display do Número Central em Destaque */}
        <div className="text-center mt-1">
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
              ? "Nenhum usuário detectado nos últimos 5 minutos"
              : totalUsers === 1
              ? "1 pessoa navegando no aplicativo neste momento"
              : `${formatNumber(totalUsers)} pessoas navegando no aplicativo neste momento`}
          </p>
        </div>
      </div>

      {/* Mini Métricas Complementares (Estilo Amplitude) */}
      <div className="grid grid-cols-2 gap-3 mt-3 border-t border-border/40 pt-3">
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

