import { createClient } from '@supabase/supabase-js';

// Configuration Supabase publique (projet de démonstration)
const supabaseUrl = 'https://xyzcompany.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NjkxNzY4OCwiZXhwIjoxOTYyNDkzNjg4fQ.demo-key-for-public-use';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour la base de données
export interface RoomRecord {
  id?: string;
  room_id: string;
  cash_box: any;
  last_updated: string;
  users: number;
  created_at: string;
}