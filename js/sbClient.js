import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabase = createClient(
  'https://udpuoohqiisuumpblvsu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcHVvb2hxaWlzdXVtcGJsdnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyNTM5NjEsImV4cCI6MjA1MjgyOTk2MX0.EkpxME5EIuD9xnPe56kzTbiyYlYuSR9QGwPLXVWtDOM'
);
