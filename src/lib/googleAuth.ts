const GOOGLE_AUTH_STORAGE_KEY = 'figus_google_access_token';
const GOOGLE_AUTH_EXPIRES_KEY = 'figus_google_access_token_expires_at';

const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/spreadsheets'
].join(' ');

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

export function getGoogleClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
}

export function getStoredAccessToken() {
  const token = sessionStorage.getItem(GOOGLE_AUTH_STORAGE_KEY);
  const expiresAt = Number(sessionStorage.getItem(GOOGLE_AUTH_EXPIRES_KEY) || 0);
  if (!token || Date.now() >= expiresAt) return null;
  return token;
}

export function clearStoredAccessToken() {
  sessionStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
  sessionStorage.removeItem(GOOGLE_AUTH_EXPIRES_KEY);
}

export function startGoogleOAuthRedirect() {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('Falta configurar VITE_GOOGLE_CLIENT_ID para conectar Google Sheets.');
  }

  const redirectUri = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: GOOGLE_SCOPES,
    include_granted_scopes: 'true',
    prompt: 'select_account'
  });

  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

export function consumeGoogleOAuthRedirect() {
  if (!window.location.hash.includes('access_token=')) return null;

  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = hashParams.get('access_token');
  const expiresIn = Number(hashParams.get('expires_in') || 3600);
  const error = hashParams.get('error');

  history.replaceState(null, document.title, window.location.pathname + window.location.search);

  if (error) {
    throw new Error(`Google rechazó el inicio de sesión: ${error}`);
  }

  if (!accessToken) return null;

  sessionStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, accessToken);
  sessionStorage.setItem(GOOGLE_AUTH_EXPIRES_KEY, String(Date.now() + Math.max(expiresIn - 60, 60) * 1000));
  return accessToken;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    throw new Error('No pudimos leer tu perfil de Google.');
  }

  const data = await res.json();
  return {
    sub: data.sub || data.email || 'google-user',
    email: data.email || '',
    name: data.name || data.email || 'Coleccionista',
    picture: data.picture || ''
  };
}
