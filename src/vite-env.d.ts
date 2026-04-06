/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALPACA_API_KEY: string;
  readonly VITE_ALPACA_SECRET_KEY: string;
  readonly VITE_ALPACA_BASE_URL?: string;
}
