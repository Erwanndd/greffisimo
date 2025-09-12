import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qryyqargqmhickidcapq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyeXlxYXJncW1oaWNraWRjYXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NDU0OTEsImV4cCI6MjA3MTUyMTQ5MX0.2zs8hTxeRkSAV8IfSvNJVO_PtZmNHWo_CqHgDc3EOzw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);