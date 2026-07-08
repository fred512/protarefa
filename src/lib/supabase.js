import { createClient } from '@supabase/supabase-js'

// A anon key é pública por design (vai no bundle do PWA).
// A proteção real dos dados é o RLS nas tabelas.
const SUPABASE_URL = 'https://qjhyxmpytsgbnemtthzd.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqaHl4bXB5dHNnYm5lbXR0aHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NjU5MzMsImV4cCI6MjA5OTA0MTkzM30.qNkHy7fTzAfmG7qszN0pTYOYSiW3ifDPhJhmoIv6nSE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
