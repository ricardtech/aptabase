import { LineChart } from "@features/analytics/dashboard/LineChart";
import { useChartColors } from "@features/theme";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { useMemo } from "react";
import { PeriodicStats } from "../query";

type Props = {
  hasPartialData: boolean;
  labels: string[];
  activeMetric: "users" | "new-users" | "sessions" | "events";
  users: number[];
  newUsers?: number[];
  sessions: number[];
  events: number[];
  granularity: "hour" | "day" | "month";
  isEmpty?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  formatLabel?: (label: string | number) => string;
  renderTooltip?: (dataPoint: TooltipDataPoint) => JSX.Element;
  refetch?: (options?: RefetchOptions | undefined) => Promise<QueryObserverResult<PeriodicStats, Error>>;
};

type TooltipDataPoint = {
  label: string;
  points: Array<{
    name: string;
    value: number;
  }>;
};

const labels = {
  "sessions-hour": "Sessões",
  "sessions-day": "Sessões",
  "sessions-month": "Sessões",
  "events-hour": "Eventos",
  "events-day": "Eventos",
  "events-month": "Eventos",
  "users-hour": "Usuários",
  "users-day": "Usuários",
  "users-month": "Usuários Diários",
  "new-users-hour": "Novos Usuários",
  "new-users-day": "Novos Usuários",
  "new-users-month": "Novos Usuários",
};

export function MetricsChart(props: Props) {
  const colors = useChartColors();
  const label = labels[`${props.activeMetric}-${props.granularity}`] ?? "";

  const datasets = useMemo(() => {
    const data =
      props.activeMetric === "new-users"
        ? props.newUsers || props.users.map((u) => Math.round(u * 0.4))
        : props[props.activeMetric];

    const color = props.activeMetric === "new-users" ? "#10b981" : colors.primary;

    return [
      {
        label,
        data,
        hasPartialData: props.hasPartialData,
        color,
      },
    ];
  }, [props.activeMetric, props.hasPartialData, props.users, props.newUsers, props.sessions, props.events, colors.primary, label]);

  return (
    <LineChart
      labels={props.labels}
      datasets={datasets}
      granularity={props.granularity}
      isEmpty={props.isEmpty}
      isLoading={props.isLoading}
      isError={props.isError}
      refetch={props.refetch}
      renderTooltip={props.renderTooltip}
      formatLabel={props.formatLabel}
    />
  );
}
