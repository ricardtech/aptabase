import { LazyLoad } from "@components/LazyLoad";
import { Page, PageHeading } from "@components/Page";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/Tooltip";
import { useApps, useCurrentApp } from "@features/apps";
import { IconShare } from "@tabler/icons-react";
import { useAtomValue, useSetAtom } from "jotai/react";
import { useSearchParams, Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { dashboardWidgetsAtom, getDashboardWidgetsForAppAtom } from "../../atoms/widgets-atoms";
import { dateFilterValuesAtom } from "../../atoms/date-atoms";
import { topEvents, topEventProps } from "./query";
import { CurrentFilters } from "./CurrentFilters";
import { AppShareInfo } from "./dashboard/AppShareInfo";
import { CountryWidget } from "./dashboard/CountryWidget";
import { DeviceWidget } from "./dashboard/DeviceWidget";
import { EventWidget } from "./dashboard/EventWidget";
import { OSWidget } from "./dashboard/OSWidget";
import { OnboardingDashboard } from "./dashboard/OnboardingDashboard";
import { TeaserDashboardContainer } from "./dashboard/TeaserDashboardContainer";
import { VersionWidget } from "./dashboard/VersionWidget";
import { SportsWidget } from "./dashboard/SportsWidget";
import { WidgetContainer } from "./dashboard/WidgetContainer";
import { EventsChartWidget } from "./dashboard/custom-widgets/EventsChartWidget";
import { RealtimeGaugeCard } from "./dashboard/RealtimeGaugeCard";
import { DateFilterContainer } from "./date-filters/DateFilterContainer";
import { MainChartWidget } from "./key_metrics/MainChartWidget";
import { AppLockedContent } from "./locked/AppLockedContent";
import { BuildModeSelector } from "./mode/BuildModeSelector";
import { DebugModeBanner } from "./mode/DebugModeBanner";

Component.displayName = "DashboardPage";

export function Component() {
  const { buildMode } = useApps();
  const app = useCurrentApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { startDateIso, endDateIso, granularity } = useAtomValue(dateFilterValuesAtom);

  const countryCode = searchParams.get("countryCode") || "";
  const appVersion = searchParams.get("appVersion") || "";
  const osName = searchParams.get("osName") || "";

  if (!app) return <Navigate to="/" />;
  if (app.lockReason) {
    return (
      <TeaserDashboardContainer app={app}>
        <AppLockedContent reason={app.lockReason} />
      </TeaserDashboardContainer>
    );
  }

  if (!app.hasEvents) return <OnboardingDashboard app={app} />;

  const resetFilters = () => navigate(`/${app.id}/`);
  const props = { appId: app.id, appName: app.name };

  const getWidgetsForApp = useAtomValue(getDashboardWidgetsForAppAtom);
  const widgetsConfig = getWidgetsForApp(app.id);
  const setWidgetsConfig = useSetAtom(dashboardWidgetsAtom);

  // 1. Consulta de propriedades de telemetria enviadas pelo app
  const { data: sportsPropsList } = useQuery({
    queryKey: ["top-sports-detect", buildMode, app.id, startDateIso, endDateIso, countryCode, appVersion, osName],
    queryFn: () =>
      topEventProps({
        buildMode,
        appId: app.id,
        startDate: startDateIso,
        endDate: endDateIso,
        granularity,
        countryCode,
        appVersion,
        osName,
      }),
    staleTime: 30000,
    enabled: !!startDateIso && !!endDateIso && !!granularity,
  });

  // 2. Consulta de eventos de telemetria enviados pelo app
  const { data: topEventsList } = useQuery({
    queryKey: ["top-events-detect", buildMode, app.id, startDateIso, endDateIso, countryCode, appVersion, osName],
    queryFn: () =>
      topEvents({
        buildMode,
        appId: app.id,
        startDate: startDateIso,
        endDate: endDateIso,
        granularity,
        countryCode,
        appVersion,
        osName,
      }),
    staleTime: 30000,
    enabled: !!startDateIso && !!endDateIso && !!granularity,
  });

  // 3. Detecção 100% inteligente baseada na TELEMETRIA do aplicativo
  const hasSportsTelemetry = useMemo(() => {
    const hasProps = (sportsPropsList || []).some((row) => {
      const key = (row.stringKey || "").toLowerCase().trim();
      return (
        key === "campeonato" ||
        key === "partida" ||
        key === "jogo" ||
        key === "confronto" ||
        key === "vôlei" ||
        key === "volei" ||
        key === "superliga" ||
        key === "canal transmissão" ||
        key === "canal transmissao" ||
        key === "canal" ||
        key === "nome do canal"
      );
    });

    const hasEvents = (topEventsList || []).some((ev) => {
      const name = (ev.name || "").toLowerCase().trim();
      return (
        name.includes("jogo") ||
        name.includes("canal") ||
        name.includes("reprodução tv") ||
        name.includes("reproduzir canal") ||
        name.includes("assistir jogo")
      );
    });

    return hasProps || hasEvents;
  }, [sportsPropsList, topEventsList]);

  const customWidgets = widgetsConfig.filter((w) => w.type === "custom-events-chart");

  const toggleMinimize = (widgetId: string) => {
    setWidgetsConfig({
      type: "toggle-minimized",
      widgetId,
      appId: app.id,
    });
  };

  const removeWidget = (widgetId: string) => {
    setWidgetsConfig({
      type: "toggle-is-defined",
      widgetId,
      appId: app.id,
    });
  };

  const aside = () => {
    if (app.hasOwnership) return null;
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger>
            <IconShare className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <LazyLoad key="shared-with-me">
              <AppShareInfo appId={app.id} />
            </LazyLoad>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Page title={app.name}>
      {buildMode === "debug" && <DebugModeBanner />}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <PageHeading title="Painel" aside={aside()} onClick={resetFilters} />
          <div className="flex items-end space-x-2">
            <BuildModeSelector />
            <DateFilterContainer />
          </div>
        </div>
        <div className="flex w-full justify-end">
          <CurrentFilters />
        </div>

        {/* Grade de Cards do Painel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Gráfico Principal de Eventos (Largura Total) */}
          <div className="md:col-span-2 rounded-lg border border-border p-4 bg-card shadow-sm">
            <MainChartWidget {...props} />
          </div>

          {/* 2. Países e Sistemas Operacionais (Linha 1) */}
          <LazyLoad key="country">
            <div className="rounded-lg border border-border p-4 bg-card h-full shadow-sm">
              <CountryWidget {...props} />
            </div>
          </LazyLoad>

          <LazyLoad key="os">
            <div className="rounded-lg border border-border p-4 bg-card h-full shadow-sm">
              <OSWidget {...props} />
            </div>
          </LazyLoad>

          {/* 3. Dispositivos e Top Esportes (Se houver telemetria esportiva) ou Dispositivos e Eventos (Se for Web/Site) */}
          <LazyLoad key="device">
            <div className="rounded-lg border border-border p-4 bg-card h-full shadow-sm">
              <DeviceWidget {...props} />
            </div>
          </LazyLoad>

          {hasSportsTelemetry ? (
            <>
              <LazyLoad key="sports-games">
                <div className="rounded-lg border border-border p-4 bg-card h-full shadow-sm">
                  <SportsWidget appId={app.id} />
                </div>
              </LazyLoad>

              {/* 4. Eventos e Versões do App */}
              <LazyLoad key="event">
                <div className="rounded-lg border border-border p-4 bg-card h-full shadow-sm">
                  <EventWidget appId={app.id} />
                </div>
              </LazyLoad>

              <LazyLoad key="version">
                <div className="rounded-lg border border-border p-4 bg-card h-full shadow-sm">
                  <VersionWidget {...props} />
                </div>
              </LazyLoad>
            </>
          ) : (
            <>
              <LazyLoad key="event">
                <div className="rounded-lg border border-border p-4 bg-card h-full shadow-sm">
                  <EventWidget appId={app.id} />
                </div>
              </LazyLoad>

              <LazyLoad key="version">
                <div className="md:col-span-2 rounded-lg border border-border p-4 bg-card h-full shadow-sm">
                  <VersionWidget {...props} />
                </div>
              </LazyLoad>
            </>
          )}

          {/* 5. Usuários no Momento (Largura Total) */}
          <div className="md:col-span-2 rounded-lg border border-border p-4 bg-card shadow-sm">
            <RealtimeGaugeCard appId={app.id} className="border-0 shadow-none p-0 bg-transparent" />
          </div>

          {/* 6. Gráficos Personalizados Adicionados pelo Usuário */}
          {customWidgets.map((widget) => {
            if (!widget.isDefined) {
              return (
                <div key={widget.id} className="md:col-span-2">
                  <EventsChartWidget {...props} widgetConfig={widget} />
                </div>
              );
            }
            return (
              <WidgetContainer
                key={widget.id}
                widgetConfig={widget}
                widgetName={widget?.title ?? "Gráfico Personalizado"}
                className="md:col-span-2"
                onToggleMinimize={() => toggleMinimize(widget.id)}
                onRemove={() => removeWidget(widget.id)}
              >
                <EventsChartWidget {...props} widgetConfig={widget} />
              </WidgetContainer>
            );
          })}
        </div>
      </div>
    </Page>
  );
}
