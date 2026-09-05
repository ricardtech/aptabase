import { IconAlertTriangle } from "@tabler/icons-react";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { Button } from "./Button";

type Props = {
  refetch?: (options?: RefetchOptions | undefined) => Promise<QueryObserverResult<any, Error>>;
};

export function ErrorState(props: Props) {
  return (
    <div className="w-full h-full text-destructive flex flex-col space-y-1 items-center justify-center">
      <p className="text-lg flex items-center space-x-2">
        <IconAlertTriangle className="h-5 w-5" />
        <span>Ops... Algo deu errado.</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Por favor, tente novamente. Se o problema persistir, entre em contato com o suporte.
      </p>
      {props.refetch && (
        <Button variant="ghost" onClick={() => props.refetch?.()} type="button">
          Atualizar
        </Button>
      )}
    </div>
  );
}
