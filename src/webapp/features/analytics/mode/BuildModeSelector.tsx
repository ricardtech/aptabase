import { Popover, PopoverContent, PopoverTrigger } from "@components/Popover";
import { BuildMode, useApps } from "@features/apps";
import { IconBug, IconRocket } from "@tabler/icons-react";
import { twJoin } from "tailwind-merge";

const options = [
  { icon: IconRocket, label: "Produção", value: "release" as BuildMode },
  { icon: IconBug, label: "Desenvolvimento", value: "debug" as BuildMode },
];

export function BuildModeSelector() {
  const { buildMode, switchBuildMode } = useApps();

  return (
    <Popover>
      <PopoverTrigger className="relative">
        {buildMode === "release" ? (
          <IconRocket className="h-5 w-5 mb-2 text-primary" stroke="1.5" />
        ) : (
          <>
            <div className="absolute rounded-full bg-warning h-1.5 w-1.5 top-0 right-0" />
            <IconBug className="h-5 w-5 mb-2 text-warning" stroke="1.5" />
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className="p-3 w-64">
        <div className="text-sm space-y-2 text-center">
          <p className="font-medium">Qual ambiente você deseja ver?</p>
          <div className="grid grid-cols-2 gap-1">
            {options.map((option) => (
              <button
                key={option.value}
                value={option.value}
                onClick={() => switchBuildMode(option.value)}
                className={twJoin(
                  "flex cursor-pointer items-center justify-center rounded py-2 px-2 text-xs focus-ring",
                  option.value === buildMode ? "bg-accent text-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center space-x-1.5">
                  <option.icon className="h-4 w-4" stroke="1.5" />
                  <span>{option.label}</span>
                </div>
              </button>
            ))}
          </div>
          <p className="text-muted-foreground text-xs text-center pt-1">
            Seus dados são separados por ambiente de compilação.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
