/*
  # Create payments table

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `payment_id` (text, external payment reference)
      - `amount` (numeric)
      - `status` (text)
      - `payment_method` (text)
      - `paid_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `payments` table
    - Add policies for reading payments
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL,
  payment_method text NOT NULL,
  paid_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own payments
CREATE POLICY "Users can read own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to read all payments
CREATE POLICY "Admins can read all payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );