import { Application, BuildMode } from "@features/apps";
import { YearlyGrid } from "./YearlyGrid";
import { useQuery } from "@tanstack/react-query";
import { api } from "@fns/api";
import { LoadingState } from "@components/LoadingState";
import { ErrorState } from "@components/ErrorState";
import { EmptyState } from "@components/EmptyState";
import { ToolsList } from "./ToolsList";
import { DevelopmentNotice } from "./DevelopmentNotice";
import { ToggleGroup, ToggleGroupList, ToggleGroupTrigger } from "@components/ToggleGroup";
import { FormatPicker } from "./FormatPicker";
import { useState } from "react";

type Props = {
  app: Application;
  buildMode: BuildMode;
};

type MonthlyUsage = {
  year: number;
  month: number;
  events: number;
};

function getMonthName(number: number) {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return months[number - 1];
}

function groupByYear(usage: MonthlyUsage[]) {
  return usage.reduce((result, item) => {
    const existingYear = result.find((entry) => entry.year === item.year);
    const monthName = getMonthName(item.month);

    if (existingYear) {
      existingYear.months.push({ number: item.month, name: monthName, events: item.events });
    } else {
      result.push({
        year: item.year,
        months: [{ number: item.month, name: monthName, events: item.events }],
      });
    }

    return result;
  }, [] as Array<{ year: number; months: Array<{ number: number; name: string; events: number }> }>);
}

export function ExportPageBody(props: Props) {
  const [format, setFormat] = useState<string>("csv");

  const {
    isLoading,
    isError,
    data: usage,
  } = useQuery({
    queryKey: ["export-usage", props.app.id, props.buildMode],
    queryFn: () => api.get<MonthlyUsage[]>(`/_export/usage`, { appId: props.app.id, buildMode: props.buildMode }),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState />;

  const grouped = groupByYear(usage || []);

  return (
    <div className="space-y-8">
      {props.buildMode === "debug" && <DevelopmentNotice />}

      <FormatPicker value={format} onChange={setFormat} />

      {grouped.map((group) => (
        <YearlyGrid
          key={group.year}
          app={props.app}
          buildMode={props.buildMode}
          year={group.year}
          months={group.months}
          format={format}
        />
      ))}

      <ToolsList />
    </div>
  );
}
