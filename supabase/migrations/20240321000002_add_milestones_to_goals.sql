-- Add milestones column to goals table
ALTER TABLE goals ADD COLUMN milestones JSONB DEFAULT '[]'::jsonb;

-- Create a function to update milestones when a milestone is added/updated/deleted
CREATE OR REPLACE FUNCTION update_goal_milestones()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE goals
        SET milestones = (
            SELECT jsonb_agg(m.*)
            FROM milestones m
            WHERE m.goal_id = NEW.goal_id
        )
        WHERE id = NEW.goal_id;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE goals
        SET milestones = (
            SELECT jsonb_agg(m.*)
            FROM milestones m
            WHERE m.goal_id = NEW.goal_id
        )
        WHERE id = NEW.goal_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE goals
        SET milestones = (
            SELECT jsonb_agg(m.*)
            FROM milestones m
            WHERE m.goal_id = OLD.goal_id
        )
        WHERE id = OLD.goal_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update goals.milestones
CREATE TRIGGER update_goal_milestones_insert
    AFTER INSERT ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_milestones();

CREATE TRIGGER update_goal_milestones_update
    AFTER UPDATE ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_milestones();

CREATE TRIGGER update_goal_milestones_delete
    AFTER DELETE ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_milestones();

-- Update existing goals with their milestones
UPDATE goals g
SET milestones = (
    SELECT jsonb_agg(m.*)
    FROM milestones m
    WHERE m.goal_id = g.id
); 