import { signInWithPassword, useOAuthProviders } from "@features/auth";
import { Page } from "@components/Page";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { DataResidency } from "./DataResidency";
import { LegalNotice } from "./LegalNotice";
import { RegionSwitch } from "./RegionSwitch";
import { SignInWithGitHub } from "./SignInWithGitHub";
import { SignInWithGoogle } from "./SignInWithGoogle";
import { Logo } from "./Logo";
import { Button } from "@components/Button";
import { TextInput } from "@components/TextInput";

const RedirectErrorMessage = () => {
  const [params] = useSearchParams();

  const error = params.get("error");
  if (!error) {
    return null;
  }
  const message = error === "expired" ? "Este link expirou." : "Este link é inválido.";

  return (
    <p className="mx-auto text-center mb-10 text-destructive text-sm">
      {message} Por favor, tente novamente.
    </p>
  );
};

Component.displayName = "LoginPage";
export function Component() {
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

    const result = await signInWithPassword(email, password);
    if (result.success) {
      window.location.href = "/";
    } else {
      setErrorMessage(result.error || "E-mail ou senha incorretos.");
      setLoading(false);
    }
  };

  return (
    <Page title="Entrar">
      <div className="mx-auto text-center mb-10">
        <RedirectErrorMessage />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Logo className="mx-auto h-12 w-auto text-primary" />
        <h2 className="text-center text-3xl text-foreground font-bold">Entrar na sua conta</h2>
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
              autoComplete="current-password"
              value={password}
              required={true}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            {errorMessage && (
              <p className="text-center text-sm text-destructive font-medium">
                {errorMessage}
              </p>
            )}

            <Button loading={loading}>Entrar</Button>
            
            <p className="text-center text-sm text-muted-foreground pt-2">
              Não tem uma conta?{" "}
              <Link className="font-semibold text-foreground hover:underline" to="/auth/register">
                Cadastrar-se
              </Link>
            </p>
          </form>
        </div>
        <LegalNotice operation="signin" />
        <RegionSwitch />
      </div>
    </Page>
  );
}
