import { useApps } from "@features/apps";
import { useAuth } from "@features/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@components/Button";
import { TextInput } from "@components/TextInput";

export function LonelyState() {
  const user = useAuth();
  const { createApp } = useApps();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProcessing(true);

    const app = await createApp(name);
    navigate(app.id);
  };

  return (
    <div className="mx-auto pt-8 lg:pt-24 max-w-3xl text-base">
      <h2 className="text-3xl font-bold sm:text-4xl">👋 Olá, {user.name}</h2>
      <p className="mt-8 text-muted-foreground">
        Cadastre sua primeira aplicação e configure o SDK de telemetria para começar.
      </p>

      <form onSubmit={handleSubmit} className="mt-8">
        <TextInput
          label="Qual é o nome do seu aplicativo?"
          name="name"
          placeholder="Ex: Meu App Incrível"
          autoComplete="off"
          required={true}
          className="w-80"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Um nome amigável para identificar seu app. Você pode alterar a qualquer momento.
        </p>
        <Button className="mt-4" disabled={name.length < 2 || name.length > 40 || processing}>
          Criar Aplicativo
        </Button>
      </form>
    </div>
  );
}
