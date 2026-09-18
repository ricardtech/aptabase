import { IconDeviceDesktop, IconDeviceMobile, IconDeviceTablet, IconDeviceTv } from "@tabler/icons-react";

type Props = {
  name: string;
};

export function Device(props: Props) {
  const name = props.name || "Desconhecido";
  const lc = name.toLowerCase();

  const getIcon = () => {
    if (
      lc.includes("tv") ||
      lc.includes("stick") ||
      lc.includes("box") ||
      lc.includes("bravia") ||
      lc.includes("chromecast") ||
      lc.includes("fire") ||
      lc.includes("leanback") ||
      lc.includes("aquario") ||
      lc.includes("tcl") ||
      lc.includes("philips") ||
      lc.includes("semp") ||
      lc.includes("aoc") ||
      lc.includes("philco")
    ) {
      return <IconDeviceTv className="h-5 w-5 text-blue-400 shrink-0" />;
    }

    if (lc.includes("tablet") || lc.includes("pad") || lc.includes("tab") || lc.includes("ipad")) {
      return <IconDeviceTablet className="h-5 w-5 text-purple-400 shrink-0" />;
    }

    if (
      lc.includes("desktop") ||
      lc.includes("linux") ||
      lc.includes("windows") ||
      lc.includes("mac") ||
      lc.includes("pc") ||
      lc.includes("notebook") ||
      lc.includes("laptop")
    ) {
      return <IconDeviceDesktop className="h-5 w-5 text-emerald-400 shrink-0" />;
    }

    return <IconDeviceMobile className="h-5 w-5 text-cyan-400 shrink-0" />;
  };

  return (
    <span className="flex items-center space-x-2 truncate">
      {getIcon()}
      <p className="truncate">{name}</p>
    </span>
  );
}
