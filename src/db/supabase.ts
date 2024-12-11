
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://gkuaioigramasybdlsfp.supabase.co'
const supabaseKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrdWFpb2lncmFtYXN5YmRsc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MDgwMDIsImV4cCI6MjA0ODE4NDAwMn0.lF0UhrRSm6tVXLH_A_ilAuRhsnYqIBBNpzFKnwsN9aI`
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase;