-- Create tables for our productivity planner app

-- Create tasks table
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    habit_id UUID REFERENCES habits(id) ON DELETE SET NULL
);

-- Create habits table
CREATE TABLE habits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL, -- 'daily', 'weekly', etc.
    streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_completed_at TIMESTAMP WITH TIME ZONE
);

-- Create habit_completions table to track habit completion history
CREATE TABLE habit_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create goals table
CREATE TABLE goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'year', 'month', 'bucket'
    year INTEGER,
    month INTEGER,
    target_date TIMESTAMP WITH TIME ZONE,
    progress INTEGER DEFAULT 0,
    status TEXT NOT NULL, -- 'not-started', 'in-progress', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create milestones table
CREATE TABLE milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create notes table
CREATE TABLE notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create calendar_events table
CREATE TABLE calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('meeting', 'task', 'reminder', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Users can view their own tasks"
    ON tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
    ON tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
    ON tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
    ON tasks FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for habits
CREATE POLICY "Users can view their own habits"
    ON habits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits"
    ON habits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
    ON habits FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
    ON habits FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for habit_completions
CREATE POLICY "Users can view their own habit completions"
    ON habit_completions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit completions"
    ON habit_completions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit completions"
    ON habit_completions FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for goals
CREATE POLICY "Users can view their own goals"
    ON goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
    ON goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
    ON goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
    ON goals FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for milestones
CREATE POLICY "Users can view their own milestones"
    ON milestones FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones"
    ON milestones FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones"
    ON milestones FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own milestones"
    ON milestones FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for notes
CREATE POLICY "Users can view their own notes"
    ON notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
    ON notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
    ON notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
    ON notes FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for calendar_events
CREATE POLICY "Users can view their own calendar events"
    ON calendar_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar events"
    ON calendar_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events"
    ON calendar_events FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events"
    ON calendar_events FOR DELETE
    USING (auth.uid() = user_id);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habits_updated_at
    BEFORE UPDATE ON habits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at
    BEFORE UPDATE ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for calendar_events updated_at
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 