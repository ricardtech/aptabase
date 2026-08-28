import { ToggleGroup, ToggleGroupList, ToggleGroupTrigger } from "@components/ToggleGroup";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function FormatPicker(props: Props) {
  return (
    <div className="flex flex-col text-xs max-w-md">
      <p className="font-medium mb-1">Formato de Exportação</p>
      <ToggleGroup defaultValue="csv" onValueChange={props.onChange}>
        <ToggleGroupList>
          <ToggleGroupTrigger value="csv" className="text-xs">
            CSV
          </ToggleGroupTrigger>
          <ToggleGroupTrigger value="parquet" className="text-xs">
            Parquet
          </ToggleGroupTrigger>
        </ToggleGroupList>
      </ToggleGroup>
      {props.value === "csv" && (
        <span className="text-muted-foreground p-1">
          O formato CSV oferece maior compatibilidade com a maioria das ferramentas, mas gera arquivos maiores dependendo do volume de dados.
        </span>
      )}
      {props.value === "parquet" && (
        <span className="text-muted-foreground p-1">
          O formato Parquet oferece excelente compressão e alta eficiência para grandes volumes de telemetria.
        </span>
      )}
    </div>
  );
}
