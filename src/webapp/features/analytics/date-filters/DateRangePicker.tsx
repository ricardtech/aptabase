import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/Select";
import { useAtom } from "jotai";
import { periodAtom } from "../../../atoms/date-atoms";

type Option = {
  value: string;
  name: string;
};

const options: Option[] = [
  { value: "today", name: "Hoje" },
  { value: "yesterday", name: "Ontem" },
  { value: "divider-6", name: "Divider" },
  { value: "24h", name: "Últimas 24 horas" },
  { value: "48h", name: "Últimas 48 horas" },
  { value: "divider-2", name: "Divider" },
  { value: "7d", name: "Últimos 7 dias" },
  { value: "30d", name: "Últimos 30 dias" },
  { value: "divider-1", name: "Divider" },
  { value: "90d", name: "Últimos 3 meses" },
  { value: "180d", name: "Últimos 6 meses" },
  { value: "365d", name: "Últimos 12 meses" },
  { value: "divider-4", name: "Divider" },
  { value: "all", name: "Todo o período" },
  { value: "custom", name: "Personalizado" },
];

type StyledOptionProps = {
  option: Option;
};

function Item(props: StyledOptionProps) {
  if (props.option.name === "Divider") {
    return <div className="border-t my-1" />;
  }

  return (
    <SelectItem key={props.option.value} value={props.option.value}>
      {props.option.name}
    </SelectItem>
  );
}

export function DateRangePicker() {
  const [period, setPeriod] = useAtom(periodAtom);

  return (
    <Select value={period} onValueChange={setPeriod}>
      <SelectTrigger className="w-38 sm:w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <Item key={option.value} option={option} />
        ))}
      </SelectContent>
    </Select>
  );
}
