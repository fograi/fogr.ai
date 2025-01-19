import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '{{SUPABASE_URL}}';
const supabaseKey = '{{SUPABASE_ANON_KEY}}';

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey);
