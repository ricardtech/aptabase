import { Page, PageHeading } from "@components/Page";
import { useApps, useCurrentApp } from "@features/apps";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { dateFilterValuesAtom } from "../../atoms/date-atoms";
import { DateFilterContainer } from "./date-filters/DateFilterContainer";
import { FunnelBuilder } from "./funnels/FunnelBuilder";
import { FunnelChart, FunnelStepData } from "./funnels/FunnelChart";
import { FunnelMetricsCards } from "./funnels/FunnelMetricsCards";
import { BuildModeSelector } from "./mode/BuildModeSelector";
import { DebugModeBanner } from "./mode/DebugModeBanner";
import { topEvents } from "./query";

Component.displayName = "FunnelsPage";

export function Component() {
  const { buildMode } = useApps();
  const app = useCurrentApp();
  const { startDateIso, endDateIso } = useAtomValue(dateFilterValuesAtom);

  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [conversionWindow, setConversionWindow] = useState<string>("86400"); // 24h padrão

  if (!app) return <Navigate to="/" />;

  // Busca os eventos disponíveis para este app no período
  const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["top-events-funnel", app.id, buildMode, startDateIso, endDateIso],
    queryFn: () =>
      topEvents({
        appId: app.id,
        buildMode,
        startDate: startDateIso,
        endDate: endDateIso,
      }),
    enabled: !!startDateIso && !!endDateIso,
  });

  const availableEvents = useMemo(() => {
    return (eventsData || []).map((e) => e.name).filter(Boolean);
  }, [eventsData]);

  // Inicializa passos padrão quando os eventos forem carregados
  useEffect(() => {
    if (selectedSteps.length === 0 && availableEvents.length >= 2) {
      // Prioridade 1: Loja de APKs
      if (
        availableEvents.some((e) => e.toLowerCase().includes("loja")) &&
        availableEvents.some((e) => e.toLowerCase().includes("download"))
      ) {
        const loja = availableEvents.find((e) => e.toLowerCase().includes("loja"))!;
        const download = availableEvents.find((e) => e.toLowerCase().includes("download"))!;
        setSelectedSteps([loja, download]);
        return;
      }

      // Prioridade 2: Play Max / Vídeo
      if (
        availableEvents.some((e) => e.toLowerCase().includes("abertura")) &&
        availableEvents.some((e) => e.toLowerCase().includes("reproduzir"))
      ) {
        const open = availableEvents.find((e) => e.toLowerCase().includes("abertura"))!;
        const play = availableEvents.find((e) => e.toLowerCase().includes("reproduzir canal")) ||
          availableEvents.find((e) => e.toLowerCase().includes("reproduzir"))!;
        setSelectedSteps([open, play]);
        return;
      }

      // Prioridade padrão: os 2 primeiros eventos mais populares
      setSelectedSteps([availableEvents[0], availableEvents[1]]);
    }
  }, [availableEvents, selectedSteps.length]);

  // Cálculo da progressão do funil com base nos eventos e etapas selecionadas
  const stepsData: FunnelStepData[] = useMemo(() => {
    if (selectedSteps.length === 0 || !eventsData || eventsData.length === 0) {
      return [];
    }

    // Mapa de contagem de cada evento no período
    const countMap = new Map<string, number>();
    eventsData.forEach((e) => {
      countMap.set(e.name, e.value || 0);
    });

    const result: FunnelStepData[] = [];
    let prevCount = 0;
    let firstCount = 0;

    selectedSteps.forEach((eventName, idx) => {
      const rawCount = countMap.get(eventName) || 0;
      
      // No funil de conversão estrita, o volume é decrescente por etapa sucessiva
      const currentCount = idx === 0 ? rawCount : Math.min(prevCount, rawCount);

      if (idx === 0) {
        firstCount = currentCount > 0 ? currentCount : 1;
      }

      const conversionFromFirst = firstCount > 0 ? (currentCount / firstCount) * 100 : 0;
      const conversionFromPrevious = prevCount > 0 ? (currentCount / prevCount) * 100 : idx === 0 ? 100 : 0;
      const dropOffRate = idx === 0 ? 0 : Math.max(0, 100 - conversionFromPrevious);

      result.push({
        stepIndex: idx + 1,
        eventName,
        usersCount: currentCount,
        conversionFromFirst,
        conversionFromPrevious,
        dropOffRate,
      });

      prevCount = currentCount;
    });

    return result;
  }, [selectedSteps, eventsData]);

  // Métricas agregadas de topo
  const totalStarted = stepsData[0]?.usersCount || 0;
  const totalCompleted = stepsData[stepsData.length - 1]?.usersCount || 0;
  const overallRate = totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;

  const biggestDropStep = useMemo(() => {
    if (stepsData.length <= 1) return null;
    let worst = stepsData[1];
    for (let i = 2; i < stepsData.length; i++) {
      if (stepsData[i].dropOffRate > worst.dropOffRate) {
        worst = stepsData[i];
      }
    }
    return worst.dropOffRate > 0
      ? { stepName: worst.eventName, dropRate: worst.dropOffRate }
      : null;
  }, [stepsData]);

  return (
    <Page title="Funis de Conversão">
      {buildMode === "debug" && <DebugModeBanner />}

      <div className="space-y-5">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageHeading
            title="Funis de Conversão"
            subtitle="Analise passo a passo a retenção, conversão e abandono entre os eventos do seu aplicativo"
          />
          <div className="flex items-end space-x-2">
            <BuildModeSelector />
            <DateFilterContainer />
          </div>
        </div>

        {/* Se o app não tiver eventos suficientes */}
        {availableEvents.length < 2 && !isLoadingEvents && (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              Eventos insuficientes para construir um funil
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              São necessários pelo menos 2 eventos registrados no período para calcular a conversão de etapas.
            </p>
          </div>
        )}

        {/* Se o app tem eventos configuráveis */}
        {availableEvents.length >= 2 && (
          <>
            {/* Cards de Métricas do Topo */}
            <FunnelMetricsCards
              totalStarted={totalStarted}
              totalCompleted={totalCompleted}
              overallRate={overallRate}
              biggestDropStep={biggestDropStep}
            />

            {/* Construtor das Etapas */}
            <FunnelBuilder
              availableEvents={availableEvents}
              selectedSteps={selectedSteps}
              onChangeSteps={setSelectedSteps}
              conversionWindow={conversionWindow}
              onChangeConversionWindow={setConversionWindow}
            />

            {/* Gráfico Visual e Tabela do Funil */}
            <FunnelChart stepsData={stepsData} />
          </>
        )}
      </div>
    </Page>
  );
}
