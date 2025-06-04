-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add RLS policies for milestones
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own milestones
CREATE POLICY "Users can view their own milestones"
    ON milestones FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own milestones
CREATE POLICY "Users can insert their own milestones"
    ON milestones FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own milestones
CREATE POLICY "Users can update their own milestones"
    ON milestones FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own milestones
CREATE POLICY "Users can delete their own milestones"
    ON milestones FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX milestones_goal_id_idx ON milestones(goal_id);
CREATE INDEX milestones_user_id_idx ON milestones(user_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER set_milestones_updated_at
    BEFORE UPDATE ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 