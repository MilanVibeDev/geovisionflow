const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase URL or Anon Key missing from environment variables.');
    // Create a dummy object to prevent crashes
    supabase = {
        from: () => ({
            select: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: null, error: new Error('Supabase missing') }) }) }) }),
            insert: () => Promise.resolve({ error: new Error('Supabase missing') })
        })
    };
} else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

module.exports = { supabase };
