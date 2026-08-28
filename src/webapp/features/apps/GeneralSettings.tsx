import { useState } from "react";
import { AppIconUpload, Application, useApps } from "@features/apps";
import { useNavigate } from "react-router-dom";
import { Button } from "@components/Button";
import { TextInput } from "@components/TextInput";
import { toast } from "sonner";

type Props = {
  app: Application;
};

export function GeneralSettings(props: Props) {
  const { updateApp, deleteApp } = useApps();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const updatedApp = await updateApp(props.app.id, name, icon);
    toast.success("Configurações do aplicativo salvas com sucesso!");
    navigate(`/${updatedApp.id}/`);
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza absoluta de que deseja excluir permanentemente o aplicativo "${props.app.name}" e todos os seus dados? Esta ação não pode ser desfeita.`)) {
      await deleteApp(props.app.id);
      toast.success(`O aplicativo "${props.app.name}" foi excluído com sucesso.`);
      navigate("/");
    }
  };

  const [name, setName] = useState(props.app.name);
  const [icon, setIcon] = useState("");

  return (
    <div className="space-y-8 max-w-[32rem]">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AppIconUpload iconPath={props.app.iconPath} onIconChanged={setIcon} />

        <TextInput
          label="Nome do Aplicativo"
          name="name"
          required={true}
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          description="Um nome amigável para identificar seu app. Você pode alterar a qualquer momento."
        />

        <div className="pt-2">
          <Button disabled={name.length < 2}>Salvar Alterações</Button>
        </div>
      </form>

      {props.app.hasOwnership && (
        <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-5 mt-8">
          <h3 className="text-base font-semibold text-destructive">Excluir Aplicativo</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Isso removerá permanentemente o aplicativo <strong className="text-foreground">{props.app.name}</strong> e todos os eventos, sessões e métricas coletadas.
          </p>
          <Button type="button" variant="destructive" onClick={handleDelete}>
            Excluir {props.app.name}
          </Button>
        </div>
      )}
    </div>
  );
}
