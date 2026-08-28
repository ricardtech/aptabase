import { trackEvent } from "@aptabase/web";
import { Page, PageHeading } from "@components/Page";
import { PingSignal } from "@components/PingSignal";
import { liveGeoDataPoints } from "@features/analytics/query";
import { useApps, useCurrentApp } from "@features/apps";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { RecentSessionsList } from "./liveview/RecentSessionsList";
import { WorldMap } from "./liveview/world/WorldMap";
import { BuildModeSelector } from "./mode/BuildModeSelector";
import { DebugModeBanner } from "./mode/DebugModeBanner";

Component.displayName = "LiveViewPage";
export function Component() {
  const { buildMode } = useApps();
  const app = useCurrentApp();

  if (!app) return <Navigate to="/" />;

  const { isLoading, data: dataPoints } = useQuery({
    queryKey: ["live-geo", app.id, buildMode],
    queryFn: () => liveGeoDataPoints({ appId: app.id, buildMode }),
    refetchInterval: 10000,
  });

  useEffect(() => {
    trackEvent("liveview_viewed", { name: app.name });
  }, [app.name]);

  const totalUsers = dataPoints?.reduce((total, point) => total + point.users, 0) ?? 0;

  const subtitle = () => {
    if (isLoading) return "";
    if (totalUsers === 0) return "Nenhum usuário na última hora";
    if (totalUsers === 1) return "1 usuário na última hora";
    return `${totalUsers} usuários na última hora`;
  };

  const aside = () => {
    if (isLoading) return null;
    return <PingSignal color="success" size="xs" />;
  };

  return (
    <Page title="Visualização ao Vivo">
      {buildMode === "debug" && <DebugModeBanner />}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <PageHeading title="Visualização ao Vivo" aside={aside()} subtitle={subtitle()} />
        <div className="flex items-center">
          <BuildModeSelector />
        </div>
      </div>

      <div className="w-full my-4 px-1 flex items-center justify-center overflow-hidden">
        <WorldMap className="w-full h-auto max-w-full aspect-[2000/857]" points={dataPoints || []} />
      </div>

      <RecentSessionsList appId={app.id} buildMode={buildMode} />
    </Page>
  );
}
