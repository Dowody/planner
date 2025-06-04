-- Add type column to goals table
ALTER TABLE goals ADD COLUMN type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'career', 'health', 'financial')); 