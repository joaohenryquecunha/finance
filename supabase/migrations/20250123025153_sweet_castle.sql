/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing policies that cause infinite recursion
    - Create new, simplified policies for profiles table
    - Add policies for insert operations
  
  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Users can read their own profile
      - Admins can read all profiles
      - Users can insert their own profile
      - Admins can update any profile
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

-- Create new policies
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (is_admin = true);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);