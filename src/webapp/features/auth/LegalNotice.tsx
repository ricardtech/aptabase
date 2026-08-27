import { isManagedCloud } from "@features/env";

type Props = {
  operation: "signin" | "signup";
};

export function LegalNotice(props: Props) {
  if (!isManagedCloud) return null;

  return (
    <p className="text-center mt-2 text-xs tracking-normal text-muted-foreground">
      By {props.operation === "signin" ? "signing in" : "signing up"}, you agree
      to our{" "}
      <a
        href="https://aptabase.com/legal/terms"
        target="_blank"
        className="text-primary hover:underline"
      >
        Termos de Serviço
      </a>{" "}
      and{" "}
      <a
        href="https://aptabase.com/legal/privacy"
        target="_blank"
        className="text-primary hover:underline"
      >
        Política de Privacidade
      </a>
      .
    </p>
  );
}
