/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Empty string in production: Caddy serves web + api on one origin, so requests are relative.
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
