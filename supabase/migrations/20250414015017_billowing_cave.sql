/*
  # Add trial period to profiles

  1. Changes
    - Add trial_expires_at column to profiles table
    - Add function to automatically set trial expiration on new accounts
    - Update RLS policies to check trial period

  2. Security
    - Maintain existing RLS policies
    - Add trial period validation
*/

-- Add trial expiration column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz;

-- Function to set trial expiration on new profiles
CREATE OR REPLACE FUNCTION set_trial_expiration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.trial_expires_at := CURRENT_TIMESTAMP + INTERVAL '30 days';
  NEW.is_approved := true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set trial expiration on new profiles
CREATE TRIGGER set_trial_expiration_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_trial_expiration();

-- Function to check if trial is valid
CREATE OR REPLACE FUNCTION is_trial_valid(profile_row profiles)
RETURNS boolean AS $$
BEGIN
  RETURN (
    profile_row.is_admin OR 
    profile_row.trial_expires_at > CURRENT_TIMESTAMP OR 
    profile_row.is_approved
  );
END;
$$ LANGUAGE plpgsql;

-- Update existing policies to include trial period check
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id AND (
    is_admin OR 
    trial_expires_at > CURRENT_TIMESTAMP OR 
    is_approved
  )
);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);