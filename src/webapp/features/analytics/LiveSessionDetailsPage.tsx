import { trackEvent } from "@aptabase/web";
import { Button } from "@components/Button";
import { Page, PageHeading } from "@components/Page";
import { liveSessionDetails } from "@features/analytics/query";
import { useApps, useCurrentApp } from "@features/apps";
import { CountryFlag, CountryName } from "@features/geo";
import { formatDate, formatTime } from "@fns/format-date";
import { formatNumber } from "@fns/format-number";
import { IconArrowLeft, IconArrowUp, IconClick, IconClock, IconDevices, IconUser } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { OSIcon } from "./dashboard/icons/os";
import { SessionTimeline } from "./liveview/timeline";

Component.displayName = "LiveSessionDetailsPage";
export function Component() {
  const { buildMode } = useApps();
  const app = useCurrentApp();
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", checkScroll, { passive: true });
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!app || !sessionId) return <Navigate to="/" />;

  const { isLoading, data } = useQuery({
    queryKey: ["live-session-details", app.id, buildMode, sessionId],
    queryFn: () => liveSessionDetails({ appId: app.id, buildMode, sessionId }),
    refetchInterval: 10000,
  });

  useEffect(() => {
    trackEvent("liveview_session_viewed");
  }, []);

  const handleBack = () => {
    if (location.state?.returnTo) {
      navigate(location.state.returnTo.pathname + location.state.returnTo.search, {
        state: { sessionFilters: location.state.sessionFilters },
      });
    } else {
      navigate(`/${app.id}/live/`);
    }
  };

  return (
    <Page title="Visualização ao Vivo">
      <div className="sticky top-0 z-30 flex flex-row justify-between items-center py-3 bg-background/95 backdrop-blur border-b border-border/40 mb-4 transition-all">
        <PageHeading title="Linha do Tempo da Sessão" subtitle={sessionId} />
        <Button variant="outline" className="shadow-sm hover:bg-accent flex items-center gap-1.5" onClick={handleBack}>
          <IconArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </div>

      {data && (
        <div className="mt-10 flex flex-col">
          <div className="flex gap-2 items-center mb-1">
            <IconDevices className="text-muted-foreground h-5 w-5" />
            <span className="tabular-nums">Versão do App {data.appVersion}</span>
          </div>
          <div className="flex gap-2 items-center mb-1">
            <IconUser className="text-muted-foreground h-5 w-5" />
            <span className="tabular-nums">{`${formatDate(data.startedAt)} ${formatTime(data.startedAt)}`}</span>
          </div>

          <div className="flex flex-col space-y-1 md:flex-row md:space-y-0">
            <div className="w-40 space-y-1">
              <div className="flex gap-2 items-center">
                <IconClock className="text-muted-foreground h-5 w-5" />
                <span className="tabular-nums">{formatNumber(data.duration, "duration")}</span>
              </div>

              <div className="flex gap-2 items-center">
                <IconClick className="text-muted-foreground h-5 w-5" />
                <span>{data.eventsCount} {data.eventsCount === 1 ? "evento" : "eventos"}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex gap-2 items-center">
                <CountryFlag countryCode={data.countryCode} />
                <div>
                  {data.regionName && <span>{data.regionName} · </span>} <CountryName countryCode={data.countryCode} />
                </div>
              </div>

              <div className="flex gap-2 items-center border-t border-border/40 pt-1.5 mt-1">
                <OSIcon name={data.osName} className="h-5 w-5" />
                <span>
                  {data.osName} {data.osVersion}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <SessionTimeline {...data} />
          </div>
        </div>
      )}

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-105 border border-border/50"
          title="Subir ao Topo"
          aria-label="Subir ao Topo"
        >
          <IconArrowUp className="h-5 w-5" />
        </button>
      )}
    </Page>
  );
}
