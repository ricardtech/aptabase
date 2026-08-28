import { Page, PageHeading } from "@components/Page";
import { useCurrentApp } from "@features/apps";
import { Navigate } from "react-router-dom";
import { BetaNotice } from "./errors/BetaNotice";
import { ErrorsList } from "./errors/ErrorsList";

Component.displayName = "ErrorsPage";
export function Component() {
  const app = useCurrentApp();

  if (!app) return <Navigate to="/" />;

  return (
    <Page title="Erros e Falhas">
      <div className="flex justify-between items-center">
        <PageHeading
          title="Erros e Falhas"
          subtitle="Rastreie e depure erros, falhas e exceções do seu aplicativo"
        />
      </div>
      <BetaNotice />
      <ErrorsList appId={app.id} />
    </Page>
  );
}
