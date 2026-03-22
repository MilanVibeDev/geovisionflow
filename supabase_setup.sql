-- Copy and paste this into your Supabase SQL Editor to create the history table

CREATE TABLE IF NOT EXISTS public.audits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    url TEXT NOT NULL,
    tech_score INTEGER,
    perf_score INTEGER,
    ai_score INTEGER,   -- AIO score (AI Input Optimisation)
    geo_score INTEGER,  -- GEO score (Generative Engine Optimisation)
    aeo_score INTEGER,  -- AEO score (Answer Engine Optimisation) — NEW
    seo_data JSONB,
    ai_audit JSONB,
    perf_data JSONB
);

-- If the table already exists, run this migration to add the new column:
-- ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS aeo_score INTEGER;

-- Enable Row Level Security (RLS)
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Since there is no user authentication yet, allow anonymous inserts and reads
CREATE POLICY "Allow anonymous insert" ON public.audits FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous read" ON public.audits FOR SELECT TO anon USING (true);

-- ==========================================
-- USER PROFILE TABLE (For Auth and Sign in)
-- Execute this to store additional user info 
-- beyond the default auth.users table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles if you wish
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
