/**
 * Template: CORS helpers for Supabase Edge Functions.
 * Copy to your project's supabase/functions/_shared/cors.ts
 *
 * CUSTOMIZE: Replace ALLOWED_ORIGINS with your actual domains.
 */

const ALLOWED_ORIGINS = [
  'https://[SUBDOMAIN].predivo.ch',
  'http://localhost:5173',
]

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

// Static export for simple cases
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://[SUBDOMAIN].predivo.ch',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Handle CORS preflight. Use at the top of every edge function:
 *
 *   if (req.method === 'OPTIONS') {
 *     return new Response('ok', { headers: getCorsHeaders(req) })
 *   }
 */
