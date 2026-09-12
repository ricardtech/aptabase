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
  } else if (lcName.includes("biglinux")) {
    lcName = "biglinux";
  } else if (lcName.includes("ubuntu")) {
    lcName = "ubuntu";
  } else if (lcName.includes("manjaro")) {
    lcName = "manjaro";
  } else if (lcName.includes("arch")) {
    lcName = "archlinux";
  } else if (lcName.includes("debian")) {
    lcName = "debian";
  } else if (lcName.includes("fedora")) {
    lcName = "fedoralinux";
  } else if (lcName.includes("linuxmint") || lcName.includes("mint")) {
    lcName = "linuxmint";
  } else if (lcName.includes("popos") || lcName.includes("pop")) {
    lcName = "popos";
  } else if (lcName.includes("zorin")) {
    lcName = "zorinos";
  } else if (lcName.includes("kali")) {
    lcName = "kalilinux";
  } else if (lcName.includes("deepin")) {
    lcName = "deepin";
  } else if (lcName.includes("elementary")) {
    lcName = "elementary";
  } else if (lcName.includes("endeavour")) {
    lcName = "endeavouros";
  } else if (lcName.includes("garuda")) {
    lcName = "garuda";
  } else if (lcName.includes("artix")) {
    lcName = "artix";
  } else if (lcName.includes("opensuse") || lcName.includes("suse")) {
    lcName = "opensuse";
  } else if (lcName.includes("gentoo")) {
    lcName = "gentoo";
  } else if (lcName.includes("alpine")) {
    lcName = "alpinelinux";
  } else if (lcName.includes("void")) {
    lcName = "voidlinux";
  } else if (lcName.includes("slackware")) {
    lcName = "slackware";
  } else if (lcName.includes("solus")) {
    lcName = "solus";
  } else if (lcName.includes("nixos")) {
    lcName = "nixos";
  } else if (lcName.includes("qubes")) {
    lcName = "qubesos";
  } else if (lcName.includes("nobara")) {
    lcName = "nobara";
  } else if (lcName.includes("bazzite")) {
    lcName = "bazzite";
  } else if (lcName.includes("redhat") || lcName.includes("rhel")) {
    lcName = "redhat";
  } else if (lcName.includes("centos")) {
    lcName = "centos";
  } else if (lcName.includes("rocky")) {
    lcName = "rockylinux";
  } else if (lcName.includes("alma")) {
    lcName = "almalinux";
  } else if (lcName.includes("tails")) {
    lcName = "tails";
  } else if (lcName.includes("freebsd")) {
    lcName = "freebsd";
  } else if (lcName.includes("openbsd")) {
    lcName = "openbsd";
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
