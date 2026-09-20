import { useApps } from "@features/apps";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { dateFilterValuesAtom } from "../../../atoms/date-atoms";
import { topEventProps } from "../query";
import { TopNTitle } from "./TopNTitle";
import { TopNSkeleton } from "./TopNSkeleton";
import { ErrorState } from "@components/ErrorState";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/Tooltip";
import { formatNumber } from "@fns/format-number";
import { useLocalStorage } from "@hooks/use-localstorage";
import { twMerge } from "tailwind-merge";
import { IconMovie, IconVideo, IconDeviceTv, IconSparkles } from "@tabler/icons-react";

type Props = {
  appId: string;
};

type MediaTab = "Séries" | "Filmes" | "Canais";

function isValidTitle(val: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();
  if (trimmed === "" || trimmed === "null" || trimmed === "undefined" || trimmed === "sem título") return false;
  
  // Ignora palavras genéricas e categorias que não são nomes de obras
  if (
    lower === "vídeo" ||
    lower === "video" ||
    lower === "série" ||
    lower === "serie" ||
    lower === "séries" ||
    lower === "series" ||
    lower === "filme" ||
    lower === "filmes" ||
    lower === "episódio" ||
    lower === "episodio" ||
    lower === "conteúdo desconhecido" ||
    lower === "conteudo desconhecido" ||
    lower === "geral" ||
    lower === "desconhecido" ||
    lower === "tipo" ||
    lower === "categoria"
  ) {
    return false;
  }

  // Ignora URLs e arquivos técnicos de streaming
  if (/^https?:\/\//i.test(trimmed)) return false;
  if (/\.(m3u8|ts|mpd|mp4|mkv|avi)(\?.*)?$/i.test(trimmed)) return false;
  if (/:\/\//i.test(trimmed)) return false;
  if (/\/(live|movie|series)\//i.test(trimmed)) return false;
  return true;
}

export function VodMediaWidget(props: Props) {
  const { buildMode } = useApps();
  const [searchParams] = useSearchParams();
  const { startDateIso, endDateIso, granularity } = useAtomValue(dateFilterValuesAtom);

  const countryCode = searchParams.get("countryCode") || "";
  const appVersion = searchParams.get("appVersion") || "";
  const osName = searchParams.get("osName") || "";

  const [activeTab, setActiveTab] = useState<MediaTab>("Séries");
  const [format, setFormat] = useLocalStorage<"absolute" | "percentage">("top_n_media_format", "absolute");

  const {
    isLoading,
    isError,
    data: rows,
    refetch,
  } = useQuery({
    queryKey: [
      "top-media-props",
      buildMode,
      props.appId,
      startDateIso,
      endDateIso,
      countryCode,
      appVersion,
      osName,
    ],
    queryFn: () =>
      topEventProps({
        buildMode,
        appId: props.appId,
        startDate: startDateIso,
        endDate: endDateIso,
        granularity,
        countryCode,
        appVersion,
        osName,
      }),
    staleTime: 10000,
    enabled: !!startDateIso && !!endDateIso && !!granularity,
  });

  const availableTabs: { key: MediaTab; label: string; icon: React.ReactNode }[] = [
    { key: "Séries", label: "Top Séries", icon: <IconVideo className="w-3.5 h-3.5" /> },
    { key: "Filmes", label: "Top Filmes", icon: <IconMovie className="w-3.5 h-3.5" /> },
    { key: "Canais", label: "Top Canais", icon: <IconDeviceTv className="w-3.5 h-3.5" /> },
  ];

  const rawFiltered = (rows || [])
    .filter((row) => {
      const key = (row.stringKey || "").toLowerCase().trim();

      if (activeTab === "Séries") {
        return (
          key === "título da série" ||
          key === "titulo da serie" ||
          key === "nome da série" ||
          key === "nome da serie" ||
          key === "série" ||
          key === "serie" ||
          key === "🍿 série"
        );
      }
      if (activeTab === "Filmes") {
        return (
          key === "título do filme" ||
          key === "titulo do filme" ||
          key === "nome do filme" ||
          key === "filme" ||
          key === "🎬 filme" ||
          key === "título" ||
          key === "titulo"
        );
      }
      if (activeTab === "Canais") {
        return (
          key === "canal" ||
          key === "nome do canal" ||
          key === "📺 canal"
        );
      }
      return false;
    })
    .filter((row) => isValidTitle(row.stringValue));

  // Agrupar itens com o mesmo nome para somar as contagens (consolidando sob o nome da série principal)
  const groupedMap = new Map<string, number>();
  for (const row of rawFiltered) {
    let name = row.stringValue.trim();
    if (activeTab === "Séries") {
      // Remove prefixos como S01E06 -, T1E01 -, EP01 -
      name = name.replace(/^(s\d+e\d+|t\d+e\d+|ep\d+|temp\s*\d+\s*ep\s*\d+)\s*[-:]*\s*/i, "");
      // Remove sufixos como - S01E06, - S01 E06, - T1, etc.
      name = name.replace(/\s*[-:]*\s*(s\d+\s*e\d+|t\d+\s*e\d+|ep\d+|temp\s*\d+|episódio\s*\d+).*$/i, "");
      // Remove anos duplicados como (2026) (2026) -> (2026)
      name = name.replace(/(\(\d{4}\))\s*\1+/g, "$1");
      name = name.trim();
    }
    groupedMap.set(name, (groupedMap.get(name) || 0) + row.events);
  }

  const items = Array.from(groupedMap.entries())
    .map(([name, value]) => ({
      name,
      value,
      key: `${activeTab}-${name}`,
    }))
    .sort((a, b) => b.value - a.value);

  const total = items.reduce((acc, item) => acc + item.value, 0);

  const toggleFormat = () => {
    setFormat(format === "absolute" ? "percentage" : "absolute");
  };

  const getEmptyLabel = () => {
    if (activeTab === "Séries") return "séries";
    if (activeTab === "Filmes") return "filmes";
    return "canais de TV";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header do Widget */}
      <div className="flex w-full flex-col gap-2 pb-2">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TopNTitle>Top Filmes, Séries & TV</TopNTitle>
          </div>
          {items.length > 0 && (
            <div
              onClick={toggleFormat}
              className={twMerge("text-muted-foreground text-xs font-normal pr-1 cursor-pointer hover:text-foreground transition-colors")}
            >
              Visualizações
            </div>
          )}
        </div>

        {/* Seleção de Abas */}
        <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto">
          {availableTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Corpo do Widget */}
      <div className="flex-1 mt-1">
        {isError ? (
          <ErrorState refetch={refetch} />
        ) : isLoading ? (
          <TopNSkeleton />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-6 my-2 rounded-lg bg-muted/20 border border-dashed border-border/60">
            <div className="p-3 rounded-full bg-muted/40 text-muted-foreground mb-2">
              <IconSparkles className="w-5 h-5 opacity-70" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Nenhum dado de {getEmptyLabel()} registrado
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
              Os conteúdos mais assistidos aparecerão aqui em tempo real assim que os clientes reproduzirem.
            </p>
          </div>
        ) : (
          <div className="grid text-sm mt-1 max-h-[22rem] overflow-y-auto divide-y divide-border/20">
            {items.map((item) => {
              const percentage = total > 0 ? item.value / total : 0;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between group py-2 px-1 relative rounded hover:bg-accent/40 transition-colors"
                >
                  <div className="relative z-10 flex w-full max-w-[calc(100%-3.5rem)] items-center">
                    <div
                      className="absolute h-7 origin-left bg-primary-100 dark:bg-primary-950/60 rounded transition-all"
                      style={{ width: `${Math.min(percentage, 1) * 100}%` }}
                    />
                    <div className="flex z-10 px-2 font-medium truncate text-foreground">
                      {item.name}
                    </div>
                  </div>
                  <p className="text-xs pr-2 z-10 tabular-nums font-semibold text-muted-foreground">
                    {format === "percentage" ? (
                      `${Math.round(percentage * 100)}%`
                    ) : item.value >= 1e3 ? (
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipContent>{item.value.toLocaleString("pt-BR")}</TooltipContent>
                          <TooltipTrigger>{formatNumber(item.value)}</TooltipTrigger>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      item.value
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
