import { Alert, AlertDescription, AlertTitle } from "@components/Alert";
import { IconFlask } from "@tabler/icons-react";

export function BetaNotice() {
  return (
    <Alert variant="warning" className="my-4">
      <IconFlask className="h-4 w-4" />
      <AlertTitle>O relatório de erros está em versão beta</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        <p>
          O suporte no SDK está sendo lançado gradualmente. Deseja no seu SDK?{" "}
          <a target="_blank" className="underline hover:text-foreground" href="https://github.com/aptabase">
            Contribuições são bem-vindas no GitHub
          </a>
          .
        </p>
      </AlertDescription>
    </Alert>
  );
}
