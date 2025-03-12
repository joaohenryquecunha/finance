/*
  # Add automatic user status update

  1. Changes
    - Add function to check and update user status
    - Add trigger to automatically update status on relevant changes
    - Add trigger to update status periodically

  2. Security
    - Function runs with security definer to ensure proper access
*/

-- Function to check and update user status
CREATE OR REPLACE FUNCTION check_and_update_user_status()
RETURNS TRIGGER AS $$
BEGIN
  -- For users without access_expiration_date and account older than 30 days
  IF NEW.access_expiration_date IS NULL AND 
     NEW.created_at + INTERVAL '30 days' < CURRENT_TIMESTAMP AND
     NEW.is_approved = true THEN
    
    NEW.is_approved = false;
  
  -- For users with expired access
  ELSIF NEW.access_expiration_date IS NOT NULL AND 
        NEW.access_expiration_date < CURRENT_TIMESTAMP AND
        NEW.is_approved = true THEN
    
    NEW.is_approved = false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check status on every update
CREATE OR REPLACE TRIGGER check_user_status_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_and_update_user_status();

-- Function to periodically check all users
CREATE OR REPLACE FUNCTION check_all_users_status()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET updated_at = CURRENT_TIMESTAMP
  WHERE (
    -- Users without access_expiration_date and account older than 30 days
    (access_expiration_date IS NULL AND 
     created_at + INTERVAL '30 days' < CURRENT_TIMESTAMP AND
     is_approved = true)
    OR
    -- Users with expired access
    (access_expiration_date IS NOT NULL AND 
     access_expiration_date < CURRENT_TIMESTAMP AND
     is_approved = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to run the check every hour
SELECT cron.schedule(
  'check-users-status',
  '0 * * * *', -- Every hour
  'SELECT check_all_users_status()'
);