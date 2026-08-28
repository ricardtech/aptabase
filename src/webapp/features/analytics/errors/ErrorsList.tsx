import { Button } from "@components/Button";
import { EmptyState } from "@components/EmptyState";
import { ErrorState } from "@components/ErrorState";
import { LoadingState } from "@components/LoadingState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/Select";
import { useApps } from "@features/apps";
import {
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconDeviceDesktop,
  IconFilter,
} from "@tabler/icons-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { dateFilterValuesAtom } from "../../../atoms/date-atoms";
import { OSIcon } from "../dashboard/icons/os";
import { DateFilterContainer } from "../date-filters/DateFilterContainer";
import { OsFilterDropdown } from "../sessions/filters/OsFilterDropdown";
import { ErrorDetailModal } from "./ErrorDetailModal";
import { ErrorTypeFilterDropdown } from "./ErrorTypeFilterDropdown";

interface ErrorItem {
  errorId: string;
  appId: string;
  timestamp: string;
  errorMessage: string;
  errorType: string;
  stackTrace: string;
  platform: string;
  osName: string;
  osVersion: string;
  appVersion: string;
  sdkVersion: string;
  sessionId: string;
  severity: string;
  kind: string;
}

interface ErrorsResponse {
  errors: ErrorItem[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
}

async function fetchErrors(
  appId: string,
  buildMode: string,
  offset: number,
  limit: number,
  startDate?: string,
  endDate?: string,
  osName?: string,
  errorType?: string,
  severity?: string,
): Promise<ErrorsResponse> {
  const params = new URLSearchParams({
    appId,
    buildMode,
    offset: offset.toString(),
    limit: limit.toString(),
  });

  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (osName) params.append("osName", osName);
  if (errorType) params.append("errorType", errorType);
  if (severity) params.append("severity", severity);

  const response = await fetch(`/api/v0/apps/${appId}/errors?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch errors");
  }
  return response.json();
}

function SeverityBadge({ severity }: { severity: string }) {
  const isFatal = severity.toLowerCase() === "fatal";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isFatal ? "bg-red-900/30 text-red-400 border border-red-800/50" : "bg-yellow-900/30 text-yellow-400 border border-yellow-800/50"
      }`}
    >
      {isFatal ? "Fatal" : "Erro"}
    </span>
  );
}

export function ErrorsList({ appId }: { appId: string }) {
  const { buildMode } = useApps();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateFilters = useAtomValue(dateFilterValuesAtom);
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);

  const [offset, setOffset] = useState(0);
  const limit = 20;

  const osName = searchParams.get("osName") || "all";
  const errorType = searchParams.get("errorType") || "all";
  const severity = searchParams.get("severity") || "all";

  const { data, isLoading, isError, refetch, isPlaceholderData } = useQuery({
    queryKey: [
      "errors",
      appId,
      buildMode,
      offset,
      limit,
      dateFilters.startDateIso,
      dateFilters.endDateIso,
      osName,
      errorType,
      severity,
    ],
    queryFn: () =>
      fetchErrors(
        appId,
        buildMode,
        offset,
        limit,
        dateFilters.startDateIso,
        dateFilters.endDateIso,
        osName !== "all" ? osName : undefined,
        errorType !== "all" ? errorType : undefined,
        severity !== "all" ? severity : undefined,
      ),
    placeholderData: keepPreviousData,
  });

  const handleOsNameChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "all" || !value) {
      newParams.delete("osName");
    } else {
      newParams.set("osName", value);
    }
    setSearchParams(newParams);
    setOffset(0);
  };

  const handleErrorTypeChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "all") {
      newParams.delete("errorType");
    } else {
      newParams.set("errorType", value);
    }
    setSearchParams(newParams);
    setOffset(0);
  };

  const handleSeverityChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "all") {
      newParams.delete("severity");
    } else {
      newParams.set("severity", value);
    }
    setSearchParams(newParams);
    setOffset(0);
  };

  const handlePreviousPage = () => {
    if (offset - limit >= 0) {
      setOffset(offset - limit);
    }
  };

  const handleNextPage = () => {
    if (data && offset + limit < data.pagination.total) {
      setOffset(offset + limit);
    }
  };

  const hasNextPage = data && offset + limit < data.pagination.total;
  const hasPreviousPage = offset > 0;

  if (isLoading) {
    return <LoadingState size="lg" />;
  }

  if (isError) {
    return <ErrorState refetch={refetch} />;
  }

  if (!data) {
    return <EmptyState />;
  }

  return (
    <div className="mt-6">
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <IconFilter className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <DateFilterContainer />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">SO:</span>
          <OsFilterDropdown appId={appId} onValueChange={(osName) => handleOsNameChange(osName ?? "all")} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tipo de Erro:</span>
          <ErrorTypeFilterDropdown appId={appId} value={errorType} onValueChange={handleErrorTypeChange} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Severidade:</span>
          <Select value={severity} onValueChange={handleSeverityChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="fatal">Fatal</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {data.errors.length === 0 && <EmptyState />}

      {data.errors.length > 0 && (
        <div className="flow-root">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full py-2 align-middle">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <IconClock className="text-muted-foreground h-5 w-5" />
                        Data / Hora
                      </div>
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <IconAlertTriangle className="text-muted-foreground h-5 w-5" />
                        Tipo de Erro
                      </div>
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold">Severidade</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold">Mensagem</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <IconDeviceDesktop className="text-muted-foreground h-5 w-5" />
                        Sistema Operacional
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {data.errors.map((error) => (
                    <tr
                      key={error.errorId}
                      className="hover:bg-accent cursor-pointer"
                      onClick={() => setSelectedErrorId(error.errorId)}
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                        {new Date(error.timestamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">{error.errorType}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <SeverityBadge severity={error.severity} />
                      </td>
                      <td className="px-3 py-4 text-sm max-w-md truncate">{error.errorMessage}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span>
                            {error.osName} {error.osVersion}
                          </span>
                          <OSIcon name={error.osName} className="h-5 w-5" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {data.pagination.total > 0 && (
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-muted-foreground">
          Exibindo {offset + 1} a {Math.min(offset + limit, data.pagination.total)} de {data.pagination.total} erros
        </div>
        <div className="flex gap-2">
          <Button disabled={!hasPreviousPage || isPlaceholderData} variant="ghost" onClick={handlePreviousPage}>
            <IconChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button disabled={!hasNextPage || isPlaceholderData} variant="ghost" onClick={handleNextPage}>
            Próximo
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      )}

      <ErrorDetailModal
        appId={appId}
        errorId={selectedErrorId}
        open={!!selectedErrorId}
        onClose={() => setSelectedErrorId(null)}
      />
    </div>
  );
}
