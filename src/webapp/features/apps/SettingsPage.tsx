import { Page, PageHeading } from "@components/Page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Tabs";
import { useCurrentApp } from "@features/apps";
import { Navigate } from "react-router-dom";
import { AppSharing } from "./AppSharing";
import { DangerZone } from "./DangerZone";
import { GeneralSettings } from "./GeneralSettings";
import { OwnershipTransfer } from "./OwnershipTransfer";

Component.displayName = "SettingsPage";
export function Component() {
  const app = useCurrentApp();

  if (!app || !app.hasOwnership) return <Navigate to="/" />;

  return (
    <Page title={`${app.name} - Configurações`}>
      <PageHeading title="Configurações" subtitle="Gerencie as configurações do seu aplicativo" />

      <Tabs defaultValue="general" className="mt-8">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="sharing">Compartilhamento</TabsTrigger>
          <TabsTrigger value="ownership">Transferência de Propriedade</TabsTrigger>
          <TabsTrigger value="danger">Zona de Perigo</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <GeneralSettings app={app} />
        </TabsContent>
        <TabsContent value="sharing">
          <AppSharing app={app} />
        </TabsContent>
        <TabsContent value="ownership">
          <OwnershipTransfer app={app} />
        </TabsContent>
        <TabsContent value="danger">
          <DangerZone app={app} />
        </TabsContent>
      </Tabs>
    </Page>
  );
}
