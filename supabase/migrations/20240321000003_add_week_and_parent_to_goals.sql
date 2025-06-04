-- Add week and parent_goal_id columns to goals table
ALTER TABLE goals 
  ADD COLUMN week INTEGER,
  ADD COLUMN parent_goal_id UUID REFERENCES goals(id) ON DELETE CASCADE;

-- Update existing goals to have null values for new columns
UPDATE goals SET week = NULL, parent_goal_id = NULL;

-- Add check constraint for week numbers
ALTER TABLE goals
  ADD CONSTRAINT valid_week CHECK (week IS NULL OR (week >= 1 AND week <= 53));

-- Add index for parent_goal_id for better query performance
CREATE INDEX idx_goals_parent_goal_id ON goals(parent_goal_id); 