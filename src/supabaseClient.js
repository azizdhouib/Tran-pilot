import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://itywlbigsmahjxekhrcw.supabase.co' // Remplace par ton URL Supabase
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eXdsYmlnc21haGp4ZWtocmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDcyNjgsImV4cCI6MjA2MzkyMzI2OH0.hgHR9OmIX31u6-Z2lkd8KHHNnpH53VjcHYmh9s9VXFg' // Remplace par ta clé publique

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
