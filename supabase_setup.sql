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
