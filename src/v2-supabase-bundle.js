import { createClient } from '@supabase/supabase-js';

globalThis.supabase = Object.freeze({ createClient });
