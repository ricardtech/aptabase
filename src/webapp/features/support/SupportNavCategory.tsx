import { IconGift, IconMessageCircle } from "@tabler/icons-react";
import { NavCategory, NavItem } from "../navigation";
import { useSupport } from "./useSupport";

export function SupportNavCategory() {
  const { toggleChat } = useSupport();

  return (
    <NavCategory title="Produto">
      <NavItem label="Ajuda e Feedback" onClick={toggleChat} icon={IconMessageCircle} />
      <NavItem label="Afiliados" href="https://aptabase.lemonsqueezy.com/affiliates" icon={IconGift} />
    </NavCategory>
  );
}
