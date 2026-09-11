const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function messageFromBody(body: string, fallback: string): string {
  if (!body) return fallback;
  try {
    const json = JSON.parse(body) as { detail?: unknown };
    if (typeof json.detail === "string") return json.detail;
    if (Array.isArray(json.detail)) {
      return json.detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: unknown }).msg);
          }
          return JSON.stringify(item);
        })
        .join("; ");
    }
  } catch {
    // plain-text body
  }
  return body;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(
      messageFromBody(body, response.statusText),
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiFetchText(
  path: string,
  init?: RequestInit,
): Promise<string> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(
      messageFromBody(body, response.statusText),
      response.status,
    );
  }

  return response.text();
}
