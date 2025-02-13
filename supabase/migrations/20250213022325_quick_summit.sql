/*
  # Create financial goals table

  1. New Tables
    - `goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `target_amount` (numeric)
      - `current_amount` (numeric)
      - `end_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `goals` table
    - Add policies for authenticated users to manage their own goals
*/

CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  current_amount numeric NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  end_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own goals"
  ON goals
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create function to update current_amount based on transactions
CREATE OR REPLACE FUNCTION update_goals_current_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current_amount for all goals of the user
  UPDATE goals
  SET current_amount = (
    SELECT COALESCE(SUM(
      CASE 
        WHEN type = 'income' THEN amount
        WHEN type = 'expense' THEN -amount
      END
    ), 0)
    FROM transactions
    WHERE user_id = NEW.user_id
    AND date >= goals.created_at
    AND date <= goals.end_date
  )
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update goals when transactions change
CREATE TRIGGER update_goals_after_transaction
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_goals_current_amount();