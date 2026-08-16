import type { User } from "@/types/auth";
import { getCurrentUser } from "@/lib/api/auth";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/lib/auth/token";

export interface AuthSession {
  user: User;
  accessToken: string;
}

export async function createSession(
  accessToken: string,
): Promise<AuthSession> {
  const user = await getCurrentUser(accessToken);

  setAccessToken(accessToken);

  return {
    user,
    accessToken,
  };
}

export async function restoreSession(): Promise<AuthSession | null> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return null;
  }

  try {
    const user = await getCurrentUser(accessToken);

    if (!user.is_active) {
      clearAccessToken();
      return null;
    }

    return {
      user,
      accessToken,
    };
  } catch {
    clearAccessToken();
    return null;
  }
}

export function logout(): void {
  clearAccessToken();
}