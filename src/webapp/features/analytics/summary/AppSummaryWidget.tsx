import { GrowthIndicator } from "@components/GrowthIndicator";
import { AppIcon, Application } from "@features/apps";
import { IconSettings } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { Link, useNavigate } from "react-router-dom";
import { dateFilterValuesAtom, periodAtom } from "../../../atoms/date-atoms";
import { AppLockedContent } from "../locked/AppLockedContent";
import { DailyUsersChart } from "./DailyUsersChart";
import { EmptyStateWidget } from "./EmptyStateWidget";
import { SummaryDataContainer } from "./SummaryDataContainer";
import { WaitingForEventsInfo } from "./WaitingForEventsInfo";

type Props = {
  app: Application;
  buildMode: "debug" | "release";
};

export function AppSummaryWidget(props: Props) {
  const navigate = useNavigate();
  const period = useAtomValue(periodAtom);
  const { startDateIso, endDateIso, granularity } = useAtomValue(dateFilterValuesAtom);

  const params = period ? `?period=${period}` : "";

  if (props.app.lockReason) {
    return (
      <EmptyStateWidget app={props.app}>
        <AppLockedContent reason={props.app.lockReason} />
      </EmptyStateWidget>
    );
  }

  if (!props.app.hasEvents) {
    return (
      <EmptyStateWidget app={props.app}>
        <WaitingForEventsInfo />
      </EmptyStateWidget>
    );
  }

  return (
    <div className="relative group border dark:border-none rounded-t-lg shadow-md bg-card hover:bg-muted h-full flex flex-col">
      <Link
        to={`/${props.app.id}${params}`}
        className="cursor-pointer h-full flex flex-col flex-1"
      >
        <SummaryDataContainer
          appId={props.app.id}
          buildMode={props.buildMode}
          startDate={startDateIso}
          endDate={endDateIso}
          granularity={granularity}
        >
          {({ dailyUsers, metrics }) => (
            <>
              <div className="px-3 py-2 h-20">
                <div className="flex items-center justify-between pr-6">
                  <div className="flex items-center space-x-2 truncate">
                    <AppIcon className="w-6 h-6" iconPath={props.app.iconPath} />
                    <span className="truncate font-medium">{props.app.name}</span>
                  </div>
                  {metrics ? (
                    <div className="flex items-center space-x-2">
                      <GrowthIndicator
                        current={metrics.current.dailyUsers}
                        previous={metrics.previous?.dailyUsers}
                        previousFormatted={`${metrics.previous?.dailyUsers.toFixed(0)} usuários diários`}
                      />
                      <span className="text-2xl font-semibold">{metrics?.current.dailyUsers.toFixed(0)}</span>
                    </div>
                  ) : null}
                </div>
                <div>{metrics ? <p className="text-sm text-muted-foreground text-right pr-6">usuários diários</p> : null}</div>
              </div>
              <div className="h-16">
                <DailyUsersChart values={dailyUsers ?? []} />
              </div>
            </>
          )}
        </SummaryDataContainer>
      </Link>

      {/* Botão de Atalho para Configurações e Exclusão do App */}
      <button
        type="button"
        title="Configurações e Exclusão do App"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigate(`/${props.app.id}/settings`);
        }}
        className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors opacity-70 group-hover:opacity-100"
      >
        <IconSettings className="w-4 h-4" />
      </button>
    </div>
  );
}
