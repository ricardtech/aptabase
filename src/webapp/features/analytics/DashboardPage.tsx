import { LazyLoad } from "@components/LazyLoad";
import { Page, PageHeading } from "@components/Page";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/Tooltip";
import { useApps, useCurrentApp } from "@features/apps";
import { IconShare } from "@tabler/icons-react";
import { useAtomValue, useSetAtom } from "jotai/react";
import { Navigate, useNavigate } from "react-router-dom";
import { dashboardWidgetsAtom, getDashboardWidgetsForAppAtom } from "../../atoms/widgets-atoms";
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

function isStreamingApp(appName: string): boolean {
  if (!appName) return false;
  const name = appName.toLowerCase();
  const streamingKeywords = [
    "play",
    "tv",
    "stream",
    "iptv",
    "tivimate",
    "player",
    "vod",
    "assistir",
    "canais",
    "filme",
    "serie",
    "ricardtv",
  ];
  return streamingKeywords.some((kw) => name.includes(kw));
}

export function Component() {
  const { buildMode } = useApps();
  const app = useCurrentApp();
  const navigate = useNavigate();

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

  const customWidgets = widgetsConfig.filter((w) => w.type === "custom-events-chart");
  const isStreaming = isStreamingApp(app.name);

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

          {/* 3. Dispositivos e Top Esportes (Se for Streaming) ou Dispositivos e Eventos (Se for Web/Site) */}
          <LazyLoad key="device">
            <div className="rounded-lg border border-border p-4 bg-card h-full shadow-sm">
              <DeviceWidget {...props} />
            </div>
          </LazyLoad>

          {isStreaming ? (
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
