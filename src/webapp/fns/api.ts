import { toast } from "sonner";

async function handleError(status: number, response: Response): Promise<void> {
  if (status >= 400) {
    try {
      const body = await response.clone().json();
      if (body?.errors && typeof body.errors === "object") {
        const message = Object.values(body.errors).flat().join("\n");
        toast.error(message);
        throw new Error(message);
      } else if (body?.message) {
        toast.error(body.message);
        throw new Error(body.message);
      }
    } catch (e: any) {
      if (e.message && e.message !== "Failed to fetch") throw e;
    }
    const text = await response.clone().text();
    const msg = text || `Erro na requisição (HTTP ${status})`;
    toast.error(msg);
    throw new Error(msg);
  }
}

const commonHeaders: RequestInit = {
  credentials: "include",
  redirect: "manual",
};

const mutatingHeaders: RequestInit = {
  ...commonHeaders,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
};

type ValidationError = {
  status: number;
  errors: Record<string, string[]>;
};

async function _fetch(method: string, path: string, body?: any): Promise<[number, Response]> {
  const normalizedPath = path.startsWith("/api/") ? path.substring(4) : path.startsWith("/api") ? path.substring(4) : path;
  const targetUrl = `/api${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;

  const response = await window.fetch(targetUrl, {
    ...(method === "GET" ? commonHeaders : mutatingHeaders),
    method,
    body: body ? JSON.stringify(body) : undefined,
  });

  return [response.status, response];
}

async function get<T>(path: string, params?: Record<string, any>): Promise<T> {
  const paramsStr = params ? new URLSearchParams(params).toString() : "";
  const pathWithParams = paramsStr ? `${path}?${paramsStr}` : path;

  const [status, response] = await _fetch("GET", pathWithParams);

  await handleError(status, response);
  if (response.status === 204) return null as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}

async function post<T>(path: string, body?: any): Promise<T> {
  const [status, response] = await _fetch("POST", path, body);

  await handleError(status, response);
  if (response.status === 204) return null as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}

async function put<T>(path: string, body?: any): Promise<T> {
  const [status, response] = await _fetch("PUT", path, body);

  await handleError(status, response);
  if (response.status === 204) return null as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}

async function _delete<T>(path: string): Promise<T> {
  const [status, response] = await _fetch("DELETE", path);

  await handleError(status, response);
  if (response.status === 204) return null as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}

async function getEmpty<T>(path: string, params?: Record<string, any>): Promise<T | null> {
  const paramsStr = params ? new URLSearchParams(params).toString() : "";
  const pathWithParams = paramsStr ? `${path}?${paramsStr}` : path;

  const [status, response] = await _fetch("GET", pathWithParams);

  await handleError(status, response);
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : null;
}

export const api = {
  fetch: _fetch,
  post,
  put,
  delete: _delete,
  get,
  handleError,
  getEmpty,
};
