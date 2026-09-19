import { useApps } from "@features/apps";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { dateFilterValuesAtom } from "../../../atoms/date-atoms";
import { topEventProps } from "../query";
import { TopNChart } from "./TopNChart";
import { TopNTitle } from "./TopNTitle";

type Props = {
  appId: string;
};

type SportsTab = "Campeonato" | "Partida" | "Canal Transmissão";

export function SportsWidget(props: Props) {
  const { buildMode } = useApps();
  const [searchParams] = useSearchParams();
  const { startDateIso, endDateIso, granularity } = useAtomValue(dateFilterValuesAtom);

  const countryCode = searchParams.get("countryCode") || "";
  const appVersion = searchParams.get("appVersion") || "";
  const osName = searchParams.get("osName") || "";

  const [activeTab, setActiveTab] = useState<SportsTab>("Campeonato");

  const {
    isLoading,
    isError,
    data: rows,
    refetch,
  } = useQuery({
    queryKey: [
      "top-sports-props",
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
        eventName: "Assistir Jogo",
        osName,
      }),
    staleTime: 10000,
    enabled: !!startDateIso && !!endDateIso && !!granularity,
  });

  const availableTabs: { key: SportsTab; label: string; icon: string }[] = [
    { key: "Campeonato", label: "Campeonatos", icon: "🏆" },
    { key: "Partida", label: "Partidas", icon: "⚽" },
    { key: "Canal Transmissão", label: "Canais", icon: "📺" },
  ];

  const items = (rows || [])
    .filter((row) => row.stringKey === activeTab && !!row.stringValue)
    .map((row) => ({
      name: row.stringValue,
      value: row.events,
      key: `${activeTab}-${row.stringValue}`,
    }))
    .sort((a, b) => b.value - a.value);

  const titleElement = (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <TopNTitle>Top Campeonatos & Jogos ao Vivo</TopNTitle>
      </div>
      <div className="flex items-center gap-1 mt-1">
        {availableTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
              activeTab === tab.key
                ? "bg-blue-600/20 border border-blue-500/40 text-blue-400 shadow-sm"
                : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <TopNChart
      id="sports-games"
      key={`sports-${activeTab}`}
      title={titleElement}
      items={items}
      isLoading={isLoading}
      isError={isError}
      refetch={refetch}
      defaultFormat="absolute"
      valueLabel="Visualizações"
    />
  );
}
