const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, headers, ...fetchOptions } = options;

  const requestHeaders = new Headers(headers);

  const isFormData =
  typeof FormData !== "undefined" &&
  options.body instanceof FormData;

if (
  !requestHeaders.has("Content-Type") &&
  options.body &&
  !isFormData
) {
  requestHeaders.set("Content-Type", "application/json");
}

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...fetchOptions,
      headers: requestHeaders,
    },
  );

  if (!response.ok) {
    let message = "An unexpected error occurred.";

    try {
      const errorBody = await response.json();

      if (
        errorBody &&
        typeof errorBody.detail === "string"
      ) {
        message = errorBody.detail;
      }
    } catch {
      // Keep the default error message if the response
      // does not contain valid JSON.
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}