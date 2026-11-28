import { useApps } from "@features/apps";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useSearchParams } from "react-router-dom";
import { dateFilterValuesAtom } from "../../atoms/date-atoms";
import { topEventProps, topEvents } from "./query";

const ANALYTICS_STALE_TIME_MS = 30_000;

/**
 * Shared TanStack Query hook for `/_stats/top-props`.
 * Using a unified queryKey across DashboardPage and widgets avoids duplicate ClickHouse queries.
 */
export function useTopEventPropsQuery(appId: string, eventName = "") {
  const { buildMode } = useApps();
  const [searchParams] = useSearchParams();
  const { startDateIso, endDateIso, granularity } = useAtomValue(dateFilterValuesAtom);

  const countryCode = searchParams.get("countryCode") || "";
  const appVersion = searchParams.get("appVersion") || "";
  const osName = searchParams.get("osName") || "";

  return useQuery({
    queryKey: [
      "top-event-props",
      buildMode,
      appId,
      startDateIso,
      endDateIso,
      countryCode,
      appVersion,
      eventName,
      osName,
    ],
    queryFn: () =>
      topEventProps({
        buildMode,
        appId,
        startDate: startDateIso,
        endDate: endDateIso,
        granularity,
        countryCode,
        appVersion,
        ...(eventName ? { eventName } : {}),
        osName,
      }),
    staleTime: ANALYTICS_STALE_TIME_MS,
    enabled: !!startDateIso && !!endDateIso && !!granularity,
  });
}

/**
 * Shared TanStack Query hook for `/_stats/top-events`.
 * Shares the exact queryKey structure with TopNDataContainer (`queryName="top-events"`).
 */
export function useTopEventsQuery(appId: string, eventName = "") {
  const { buildMode } = useApps();
  const [searchParams] = useSearchParams();
  const { startDateIso, endDateIso, granularity } = useAtomValue(dateFilterValuesAtom);

  const countryCode = searchParams.get("countryCode") || "";
  const appVersion = searchParams.get("appVersion") || "";
  const osName = searchParams.get("osName") || "";

  return useQuery({
    queryKey: [
      "top-events",
      buildMode,
      appId,
      startDateIso,
      endDateIso,
      countryCode,
      appVersion,
      eventName,
      osName,
    ],
    queryFn: () =>
      topEvents({
        buildMode,
        appId,
        startDate: startDateIso,
        endDate: endDateIso,
        granularity,
        countryCode,
        appVersion,
        eventName,
        osName,
      }),
    staleTime: ANALYTICS_STALE_TIME_MS,
    enabled: !!startDateIso && !!endDateIso && !!granularity,
  });
}
