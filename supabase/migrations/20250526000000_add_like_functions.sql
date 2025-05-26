
-- Function to increment discussion likes
CREATE OR REPLACE FUNCTION increment_discussion_likes(discussion_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE discussions 
  SET likes = likes + 1 
  WHERE id = discussion_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement discussion likes
CREATE OR REPLACE FUNCTION decrement_discussion_likes(discussion_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE discussions 
  SET likes = GREATEST(likes - 1, 0)
  WHERE id = discussion_id;
END;
$$ LANGUAGE plpgsql;
