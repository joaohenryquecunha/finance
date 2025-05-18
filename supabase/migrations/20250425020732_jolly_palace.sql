/*
  # Create companies table and related schemas

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `cnpj` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `companies` table
    - Add policies for authenticated users to manage their own companies
*/

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  cnpj text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, cnpj)
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create function to update updated_at on companies
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();