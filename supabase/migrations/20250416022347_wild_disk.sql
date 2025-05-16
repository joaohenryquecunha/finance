/*
  # Add access duration to profiles

  1. Changes
    - Add access_duration column to profiles table to store duration in seconds
    - Update existing profiles to set access_duration based on trial_expires_at
    - Add function to calculate days remaining

  2. Security
    - Maintain existing RLS policies
*/

-- Add access duration column (stores duration in seconds)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS access_duration bigint DEFAULT NULL;

-- Update existing profiles to set access_duration based on trial_expires_at
UPDATE profiles
SET access_duration = EXTRACT(EPOCH FROM (trial_expires_at - created_at))
WHERE trial_expires_at IS NOT NULL;

-- Function to calculate days remaining
CREATE OR REPLACE FUNCTION calculate_days_remaining(start_time timestamptz, duration_seconds bigint)
RETURNS integer AS $$
BEGIN
  RETURN FLOOR(
    EXTRACT(EPOCH FROM (start_time + (duration_seconds || ' seconds')::interval - CURRENT_TIMESTAMP)) / 86400
  )::integer;
END;
$$ LANGUAGE plpgsql;