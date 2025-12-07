import { createClient } from '@supabase/supabase-js';

// Credentials provided by the user
const supabaseUrl = 'https://kolxoazumlpipeffkcvj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbHhvYXp1bWxwaXBlZmZrY3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzI4NjgsImV4cCI6MjA2MDMwODg2OH0.hGEYCLWuOWwYvERr1C9dONK5xWFC1PU0n9Y2Z5RVNf8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);