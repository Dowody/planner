-- Add week column to goals table
ALTER TABLE goals 
  ADD COLUMN week INTEGER;

-- Add check constraint for week numbers
ALTER TABLE goals
  ADD CONSTRAINT valid_week CHECK (week IS NULL OR (week >= 1 AND week <= 53)); 