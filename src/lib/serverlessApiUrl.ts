/**
 * Build the URL for Vercel serverless routes (`/api/chat`, `/api/generate-portfolio`, etc.).
 *
 * - **Production (Vercel):** leave `VITE_API_ORIGIN` unset → same-origin `/api/...` works.
 * - **Local `npm run dev`:** Vite does not run `api/*.js`. Either:
 *   - Add `VITE_API_ORIGIN=https://your-deployment.vercel.app` to `.env.local` (no trailing slash),
 *     then restart the dev server — the client calls that origin and `vite.config` can proxy `/api/*`
 *     there too; or
 *   - Run `vercel dev` instead of plain Vite.
 */
export function serverlessApiUrl(path: string): string {
  const raw = import.meta.env.VITE_API_ORIGIN;
  const origin = typeof raw === 'string' ? raw.replace(/\/$/, '') : '';
  const p = path.startsWith('/') ? path : `/${path}`;
  if (origin) return `${origin}${p}`;
  return p;
}

const LOCAL_HINT =
  'If you are running `npm run dev` locally, add VITE_API_ORIGIN=https://your-app.vercel.app to .env.local (your deployed site URL, no trailing slash) and restart the dev server.';

/** Turn `TypeError: Failed to fetch` into a clearer message for AI / serverless calls. */
export function explainServerlessNetworkError(err: unknown): string {
  if (err instanceof TypeError && String(err.message).toLowerCase().includes('fetch')) {
    return `Network error — could not reach the API. ${LOCAL_HINT}`;
  }
  if (err instanceof Error) return err.message;
  return 'Network error';
}
