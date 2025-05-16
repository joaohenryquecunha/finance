/*
  # Add access expiration date to profiles

  1. Changes
    - Add access_expires_at column to profiles table
    - Update function to calculate access expiration
    - Add trigger to automatically update expiration date

  2. Security
    - Maintain existing RLS policies
    - Add expiration date validation
*/

-- Add access expiration column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS access_expires_at timestamptz;

-- Update existing profiles to set access_expires_at based on created_at and access_duration
UPDATE profiles
SET access_expires_at = created_at + (access_duration || ' seconds')::interval
WHERE access_duration IS NOT NULL;

-- Function to update access expiration date
CREATE OR REPLACE FUNCTION update_access_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.access_duration IS NOT NULL THEN
    NEW.access_expires_at := NEW.created_at + (NEW.access_duration || ' seconds')::interval;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update access_expires_at
CREATE TRIGGER update_access_expiration_trigger
  BEFORE INSERT OR UPDATE OF access_duration ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_access_expiration();

-- Update policies to check expiration date
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id AND (
    is_admin OR 
    access_expires_at > CURRENT_TIMESTAMP OR
    is_approved
  )
);