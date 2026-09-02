import { Icon3dCubeSphere } from "@tabler/icons-react";
import { IconApple } from "./apple";

type Props = {
  name: string;
  className: string;
};

const icons = import.meta.glob<string>("./*.svg", {
  eager: true,
  import: "default",
});

export function OSIcon(props: Props) {
  let lcName = (props.name || "").toLowerCase().replaceAll(/[^a-z0-9]*/g, "");
  if (lcName === "ios" || lcName === "ipados" || lcName === "tvos") {
    return <IconApple className={props.className} />;
  }
  if (lcName === "fedora") lcName = "fedoralinux";

  const pathKey = `./${lcName}.svg`;
  const iconSrc = icons[pathKey] || icons["./linux.svg"];

  if (!iconSrc) {
    return <Icon3dCubeSphere className={props.className} />;
  }

  return <img src={iconSrc} alt={props.name} className={props.className} loading="lazy" />;
}
