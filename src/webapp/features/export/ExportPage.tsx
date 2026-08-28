import { Page, PageHeading } from "@components/Page";
import { useApps, useCurrentApp } from "@features/apps";
import { Navigate } from "react-router-dom";
import { BuildModeSelector } from "@features/analytics/mode/BuildModeSelector";
import { DebugModeBanner } from "@features/analytics/mode/DebugModeBanner";
import { ExportPageBody } from "./ExportPageBody";

Component.displayName = "ExportPage";
export function Component() {
  const app = useCurrentApp();
  const { buildMode } = useApps();

  if (!app) return <Navigate to="/" />;

  return (
    <Page title="Exportar Dados">
      {buildMode === "debug" && <DebugModeBanner />}

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <PageHeading title="Exportar Dados" subtitle="Liberdade para explorar e analisar seus dados brutos" />
        <div className="flex items-center">
          <BuildModeSelector />
        </div>
      </div>

      <div className="max-w-3xl mt-8">
        <ExportPageBody app={app} buildMode={buildMode} />
      </div>
    </Page>
  );
}
