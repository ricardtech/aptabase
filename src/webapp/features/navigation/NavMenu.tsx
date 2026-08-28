import { useCurrentApp } from "@features/apps";
import { isSupportEnabled } from "@features/env";
import { SupportNavCategory } from "@features/support";
import {
  IconActivityHeartbeat,
  IconAlertTriangle,
  IconCloudDownload,
  IconCode,
  IconGraph,
  IconLayoutGrid,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { NavCategory } from "./NavCategory";
import { NavItem } from "./NavItem";

export function NavMenu(props: { onNavigation?: VoidFunction }) {
  const currentApp = useCurrentApp();

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6">
        <NavCategory>
          <NavItem label="Início" href="/" icon={IconLayoutGrid} onNavigation={props.onNavigation} />
        </NavCategory>
        <NavCategory title="Aplicativo">
          <NavItem
            label="Painel"
            disabled={!currentApp}
            href={`/${currentApp?.id}/`}
            icon={IconGraph}
            onNavigation={props.onNavigation}
          />
          <NavItem
            label="Visualização ao Vivo"
            disabled={!currentApp || !!currentApp.lockReason}
            href={`/${currentApp?.id}/live`}
            icon={IconActivityHeartbeat}
            onNavigation={props.onNavigation}
          />
          <NavItem
            label="Usuários e Sessões"
            disabled={!currentApp || !!currentApp.lockReason}
            href={`/${currentApp?.id}/sessions`}
            icon={IconUsers}
            onNavigation={props.onNavigation}
          />
          <NavItem
            label="Erros e Falhas"
            disabled={!currentApp || !!currentApp.lockReason}
            href={`/${currentApp?.id}/errors`}
            icon={IconAlertTriangle}
            onNavigation={props.onNavigation}
          />
          <NavItem
            label="Exportar"
            disabled={!currentApp || !!currentApp.lockReason}
            href={`/${currentApp?.id}/export`}
            icon={IconCloudDownload}
            onNavigation={props.onNavigation}
          />
          <NavItem
            label="Instruções"
            disabled={!currentApp}
            href={`/${currentApp?.id}/instructions`}
            icon={IconCode}
            onNavigation={props.onNavigation}
          />
          <NavItem
            label="Configurações"
            disabled={!currentApp || !currentApp.hasOwnership}
            disabledReason={
              currentApp && !currentApp.hasOwnership ? "Settings are available only to application owners" : undefined
            }
            href={`/${currentApp?.id}/settings`}
            icon={IconSettings}
            onNavigation={props.onNavigation}
          />
        </NavCategory>
        {isSupportEnabled && <SupportNavCategory />}
      </div>
    </div>
  );
}
