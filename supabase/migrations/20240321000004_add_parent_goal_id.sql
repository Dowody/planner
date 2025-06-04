-- Add parent_goal_id column to goals table
ALTER TABLE goals 
  ADD COLUMN parent_goal_id UUID REFERENCES goals(id) ON DELETE CASCADE;

-- Add index for parent_goal_id for better query performance
CREATE INDEX idx_goals_parent_goal_id ON goals(parent_goal_id); 