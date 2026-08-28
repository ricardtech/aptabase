import { trackEvent } from "@aptabase/web";
import { Markdown } from "@components/Markdown";
import { Page, PageHeading } from "@components/Page";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@components/Select";
import { useCurrentApp } from "@features/apps";
import { IconCopy } from "@tabler/icons-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import frameworks from "./frameworks";
import { getFrameworkInstructions } from "./customInstructions";

Component.displayName = "InstructionsPage";
export function Component() {
  const app = useCurrentApp();

  if (!app) return <Navigate to="/" />;

  const [selected, setSelected] = useState("nextjs");
  const [justCopied, setJustCopied] = useState(false);

  const fw = frameworks[selected];
  const content = getFrameworkInstructions(selected, app.appKey);

  const handleSelectFramework = (frameworkId: string) => {
    setSelected(frameworkId);
    trackEvent("instructions_viewed", { framework: frameworkId });
  };

  return (
    <Page title={`${app.name} - Instruções`}>
      <PageHeading title="Instruções do SDK" subtitle="Integre seu aplicativo com o nosso SDK" />
      <div className="flex flex-col space-y-8 mt-8">
        <div className="px-4 py-3 bg-muted max-w-fit rounded border">
          <p className="text-muted-foreground text-sm mb-1 font-medium">
            Chave de aplicativo para <span className="text-foreground font-semibold">{app.name}</span>
          </p>
          <div className="flex items-center mb-2 gap-2 min-w-64">
            <span className="font-medium text-xl font-mono">{app.appKey}</span>
            <IconCopy
              className="cursor-pointer hover:text-muted-foreground transition-colors duration-200 ease-in-out"
              stroke={2}
              onClick={() => {
                setJustCopied(true);
                setTimeout(() => setJustCopied(false), 2000);
                navigator.clipboard.writeText(app.appKey);
              }}
            />
            {justCopied && <span className="text-xs text-primary font-semibold">Copiado!</span>}
          </div>
          <p className="text-muted-foreground text-xs">É utilizada pelo SDK para identificar o seu aplicativo.</p>
        </div>

        <div className="flex items-center border-b pb-4 justify-between">
          <div className="flex items-center space-x-4">
            <Select value={selected} onValueChange={handleSelectFramework}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Selecione um framework" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                <SelectGroup>
                  {Object.entries(frameworks).map(([id, item]) => (
                    <SelectItem key={item.name} value={id}>
                      <div className="flex gap-2 items-center">
                        <img
                          src={item.icon}
                          className={twMerge("w-4 h-4", item.invert && "dark:filter dark:invert")}
                          alt={item.name}
                        />
                        <span>{item.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {fw && (
            <a
              className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
              target="_blank"
              rel="noreferrer"
              href={fw.repository}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Ver no GitHub
            </a>
          )}
        </div>

        <Markdown content={content} baseURL={fw?.baseURL ?? ""} />
      </div>
    </Page>
  );
}
