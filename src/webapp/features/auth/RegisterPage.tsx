import { registerWithPassword, useOAuthProviders } from "@features/auth";
import { Page } from "@components/Page";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DataResidency } from "./DataResidency";
import { LegalNotice } from "./LegalNotice";
import { RegionSwitch } from "./RegionSwitch";
import { SignInWithGitHub } from "./SignInWithGitHub";
import { SignInWithGoogle } from "./SignInWithGoogle";
import { Logo } from "./Logo";
import { Button } from "@components/Button";
import { TextInput } from "@components/TextInput";

Component.displayName = "RegisterPage";
export function Component() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const providers = useOAuthProviders();
  const showOAuth = providers.github || providers.google;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const result = await registerWithPassword(name, email, password);
    if (result.success) {
      navigate("/");
    } else {
      setErrorMessage(result.error || "Erro ao criar conta.");
      setLoading(false);
    }
  };

  return (
    <Page title="Criar Conta">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Logo className="mx-auto h-12 w-auto text-primary" />
        <h2 className="text-center text-3xl font-bold text-foreground">Criar uma nova conta</h2>
        <DataResidency />
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="py-8 px-4 sm:rounded-lg sm:px-10 bg-card border rounded">
          {showOAuth && (
            <>
              <div className="space-y-2">
                {providers.github && <SignInWithGitHub />}
                {providers.google && <SignInWithGoogle />}
              </div>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-muted">OU</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <TextInput
              label="Nome Completo"
              name="name"
              placeholder="Seu Nome"
              value={name}
              required={true}
              onChange={(e) => setName(e.target.value)}
            />
            <TextInput
              label="Endereço de E-mail"
              name="email"
              type="email"
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
              value={email}
              required={true}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextInput
              label="Senha"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              required={true}
              onChange={(e) => setPassword(e.target.value)}
            />

            {errorMessage && (
              <p className="text-center text-sm text-destructive font-medium">
                {errorMessage}
              </p>
            )}

            <Button loading={loading}>Cadastrar e Entrar</Button>

            <p className="text-center text-sm text-muted-foreground pt-2">
              Já tem cadastro?{" "}
              <Link className="font-medium text-foreground hover:underline" to="/auth">
                Entrar
              </Link>{" "}
              na sua conta.
            </p>
          </form>
        </div>
        <LegalNotice operation="signup" />
        <RegionSwitch />
      </div>
    </Page>
  );
}
