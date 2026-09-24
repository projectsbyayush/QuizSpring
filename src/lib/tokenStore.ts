export interface StoredSession {
  access_token: string;
  refresh_token: string;
}

const sessionKey = 'quizspring.session';
let memorySession: StoredSession | null = null;

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getStoredSession(): StoredSession | null {
  const local = storage();
  if (!local) return memorySession;
  try {
    const value = local.getItem(sessionKey);
    if (!value) return memorySession;
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'access_token' in parsed &&
      'refresh_token' in parsed &&
      typeof parsed.access_token === 'string' &&
      typeof parsed.refresh_token === 'string'
    ) {
      memorySession = { access_token: parsed.access_token, refresh_token: parsed.refresh_token };
      return memorySession;
    }
  } catch {
    memorySession = null;
  }
  return memorySession;
}

export function storeSession(session: StoredSession): void {
  memorySession = session;
  const local = storage();
  if (!local) return;
  try {
    local.setItem(sessionKey, JSON.stringify(session));
  } catch {
    return;
  }
}

export function clearStoredSession(): void {
  memorySession = null;
  const local = storage();
  if (!local) return;
  try {
    local.removeItem(sessionKey);
  } catch {
    return;
  }
}
