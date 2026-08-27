import { api } from "@fns/api";
import { trackEvent } from "@aptabase/web";

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
};

export type OAuthProviders = {
  github: boolean;
  google: boolean;
};

export async function getOAuthProviders(): Promise<OAuthProviders> {
  return await api.get<OAuthProviders>("/_auth/providers");
}

export async function signInWithPassword(email: string, password?: string): Promise<{ success: boolean; error?: string }> {
  const [status, response] = await api.fetch("POST", "/_auth/signin", {
    email,
    password,
  });

  if (status === 200) {
    trackEvent("signin");
    return { success: true };
  }

  if (status === 401) {
    const data = await response.json().catch(() => ({}));
    return { success: false, error: data.message || "E-mail ou senha incorretos." };
  }

  if (status === 404) {
    return { success: false, error: "Não foi possível encontrar uma conta com esse e-mail." };
  }

  await api.handleError(status, response);
  return { success: false, error: "Erro ao realizar autenticação." };
}

export async function registerWithPassword(name: string, email: string, password?: string): Promise<{ success: boolean; error?: string }> {
  const [status, response] = await api.fetch("POST", "/_auth/register", {
    name,
    email,
    password,
  });

  if (status === 200) {
    trackEvent("register");
    return { success: true };
  }

  if (status === 400 || status === 409) {
    const data = await response.json().catch(() => ({}));
    return { success: false, error: data.message || "Erro ao registrar usuário." };
  }

  await api.handleError(status, response);
  return { success: false, error: "Erro ao registrar conta." };
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const [status, response] = await api.fetch("POST", "/_auth/password/change", {
    currentPassword,
    newPassword,
  });

  if (status === 200) {
    return { success: true };
  }

  const data = await response.json().catch(() => ({}));
  return { success: false, error: data.message || "Senha atual incorreta ou erro ao alterar." };
}

export async function requestSignInLink(email: string): Promise<boolean> {
  const res = await signInWithPassword(email);
  return res.success;
}

export async function requestRegisterLink(name: string, email: string): Promise<void> {
  await registerWithPassword(name, email);
}

export async function me(): Promise<UserAccount | null> {
  const [status, account] = await api.fetch("GET", "/_auth/me");

  if (status === 401) return null;

  return account.json() as Promise<UserAccount | null>;
}

export async function signOut(): Promise<void> {
  await api.fetch("POST", "/_auth/signout");
  location.href = "/auth";
}
