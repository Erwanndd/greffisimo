import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qryyqargqmhickidcapq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyeXlxYXJncW1oaWNraWRjYXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NDU0OTEsImV4cCI6MjA3MTUyMTQ5MX0.2zs8hTxeRkSAV8IfSvNJVO_PtZmNHWo_CqHgDc3EOzw';

const clientOptions = {};
// Allow overriding Functions URL in dev (e.g., local functions serve)
try {
  const overrideUrl = import.meta?.env?.VITE_SUPABASE_FUNCTIONS_URL;
  if (overrideUrl) {
    clientOptions.functions = { url: overrideUrl };
    // eslint-disable-next-line no-console
    console.log('[Supabase] Using custom Functions URL:', overrideUrl);
  }
} catch (_) {}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);
