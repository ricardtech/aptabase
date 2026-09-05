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

  if (lcName.includes("android") || lcName.includes("firetv") || lcName.includes("fireos")) {
    lcName = "android";
  } else if (lcName.includes("windows")) {
    lcName = "windows";
  } else if (lcName.includes("chromeos") || lcName.includes("cros")) {
    lcName = "chromeos";
  } else if (lcName === "fedora") {
    lcName = "fedoralinux";
  } else if (lcName === "arch") {
    lcName = "archlinux";
  } else if (lcName.includes("linuxmint") || lcName === "mint") {
    lcName = "linuxmint";
  } else if (lcName.includes("popos") || lcName.includes("pop")) {
    lcName = "popos";
  }

  const pathKey = `./${lcName}.svg`;
  const iconSrc =
    icons[pathKey] ||
    (lcName.includes("linux") || lcName.includes("gnu") ? icons["./linux.svg"] : undefined);

  if (!iconSrc) {
    return <Icon3dCubeSphere className={props.className} />;
  }

  return <img src={iconSrc} alt={props.name} className={props.className} loading="lazy" />;
}
