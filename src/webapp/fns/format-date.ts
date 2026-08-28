import { format, parseJSON } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(value: Date | string | undefined): string {
  if (!value) return "";

  return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
}

export function formatTime(value: Date | string | undefined): string {
  if (!value) return "";

  return format(new Date(value), "HH:mm:ss", { locale: ptBR });
}

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function formatPeriod(granularity: "hour" | "day" | "month", period: string) {
  try {
    if (granularity === "hour") {
      return format(parseJSON(period), "HH:mm");
    }

    const [year, month, day] = period.substring(0, 10).split("-");
    const monthIndex = parseInt(month, 10) - 1;
    const monthName = months[monthIndex] ?? month;

    switch (granularity) {
      case "day":
        return `${day} ${monthName}`;
      case "month":
        return `${monthName} ${year}`;
    }
  } catch (e) {
    return period;
  }
}

export function formatDateWithoutYear(value: Date | string | undefined): string {
  if (!value) return "";

  return format(new Date(value), "d 'de' MMM", { locale: ptBR });
}
