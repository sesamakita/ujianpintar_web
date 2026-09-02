import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://njwmmigqkvvuujdmtjes.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qd21taWdxa3Z2dXVqZG10amVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMjE4NDAsImV4cCI6MjEwMjc5Nzg0MH0.IVTfEtjRvmGlkB_b8lsgHjMTUqJihk_hvlBFCg4cy8Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export default supabase;
