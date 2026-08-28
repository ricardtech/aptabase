import { Application, useApps } from "@features/apps";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@components/Button";

type Props = {
  app: Application;
};

export function DangerZone(props: Props) {
  const { deleteApp } = useApps();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (window.confirm(`Tem certeza absoluta de que deseja excluir o aplicativo '${props.app.name}'?`)) {
      await deleteApp(props.app.id);
      toast(`O aplicativo ${props.app.name} foi excluído.`);
      navigate("/");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border bg-card rounded p-4 max-w-md">
      <h2 className="text-lg font-semibold">Excluir {props.app.name}?</h2>
      <div className="text-sm text-muted-foreground mt-1">
        Isso excluirá permanentemente o aplicativo e todos os dados associados.
      </div>
      <div className="mt-4">
        <div className="w-20">
          <Button variant="destructive">Excluir</Button>
        </div>
      </div>
    </form>
  );
}
