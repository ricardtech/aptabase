import { Link } from "react-router-dom";
import { isSupportEnabled } from "@features/env";
import { ContactUsLink } from "@features/support";
import { PingSignal } from "@components/PingSignal";
import { useCurrentApp } from "@features/apps";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import { useState } from "react";

type Props = {
  appId: string;
};

export function WaitingForEventsContent(props: Props) {
  const app = useCurrentApp();
  const [justCopied, setJustCopied] = useState(false);

  return (
    <>
      <p className="text-center font-semibold">Aguardando o primeiro evento...</p>

      {app && (
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-1">
            Chave de aplicativo para <span className="text-foreground">{app.name}</span>
          </p>
          <div className="flex items-center mb-2 gap-2">
            <span className="font-medium text-xl">{app.appKey}</span>
            {!justCopied && (
              <IconCopy
                className="cursor-pointer hover:text-muted-foreground transition-colors duration-200 ease-in-out"
                stroke={2}
                onClick={() => {
                  setJustCopied(true);
                  setTimeout(() => setJustCopied(false), 2000);
                  navigator.clipboard.writeText(app.appKey);
                }}
              />
            )}

            {justCopied && <IconCheck stroke={2} />}
          </div>
        </div>
      )}
      <p className="text-center text-muted-foreground mx-14">
        Instale o{" "}
        <Link to={`/${props.appId}/instructions`} className="text-foreground underline">
          SDK do Aptabase
        </Link>{" "}
        no seu aplicativo para começar a coletar eventos.
      </p>
      <PingSignal color="success" />
      {isSupportEnabled && (
        <div className="w-full space-y-4">
          <hr className="mx-4" />
          <p className="text-xs text-center text-muted-foreground">
            Precisa de ajuda? <ContactUsLink className="text-white underline">Fale conosco</ContactUsLink>
          </p>
        </div>
      )}
    </>
  );
}
