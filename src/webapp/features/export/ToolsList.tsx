import { IconCode, TablerIconsProps } from "@tabler/icons-react";
import { twMerge } from "tailwind-merge";

type ToolProps = {
  icon: string | ((props: TablerIconsProps) => JSX.Element);
  iconClassName?: string;
  name: string;
  href: string;
  description: string;
};

function iconUrl(name: string): string | undefined {
  const svg = new URL(`./icons/${name}.svg`, import.meta.url);
  if (svg.href.endsWith("/undefined")) {
    return undefined;
  }

  return svg.href;
}

function Tool(props: ToolProps) {
  return (
    <a
      href={props.href}
      className="flex border p-4 rounded-lg bg-card w-full hover:bg-muted"
      target="_blank"
      rel="noopener noreferrer"
    >
      {typeof props.icon === "string" ? (
        <img src={iconUrl(props.icon)} className={twMerge("h-6 w-6 mt-1", props.iconClassName)} />
      ) : (
        <props.icon className={twMerge("h-6 w-6 mt-1", props.iconClassName)} />
      )}
      <div className="flex flex-col ml-4">
        <span className="font-medium">{props.name}</span>
        <p className="text-sm text-muted-foreground">{props.description}</p>
      </div>
    </a>
  );
}

export function ToolsList() {
  return (
    <div>
      <p className="text-sm mb-2 font-medium">Aqui está uma lista de ferramentas que você pode usar para consultar seus dados:</p>
      <div className="space-y-2 max-w-3xl">
        <Tool
          icon="excel"
          name="Microsoft Excel"
          href="https://www.microsoft.com/pt-br/microsoft-365"
          description="A planilha mais popular do mundo funciona muito bem com arquivos CSV do Aptabase. Abra no Excel e explore seus dados com tabelas dinâmicas e gráficos."
        />

        <Tool
          icon="powerbi"
          name="Microsoft Power BI"
          href="https://powerbi.microsoft.com/pt-br/"
          description="O Power BI é uma ferramenta poderosa para visualização e análise avançada de dados de telemetria."
        />

        <Tool
          icon="jupyter"
          name="JupyterLab e Jupyter Notebook"
          href="https://jupyter.org/"
          description="O Jupyter é uma ferramenta flexível para análise e ciência de dados com suporte a Python, R e visualizações customizadas."
        />

        <Tool
          icon={IconCode}
          name="Crie sua própria pipeline"
          href="https://google.com"
          description="O formato CSV é amplamente suportado nativamente pela maioria das linguagens de programação e bancos de dados."
        />
      </div>
    </div>
  );
}
