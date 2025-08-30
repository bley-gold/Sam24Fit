/*
  # Create reviews table for user feedback

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `review_text` (text)
      - `rating` (integer, 1-5)
      - `status` (text, pending/approved/rejected)
      - `is_featured` (boolean)
      - `rejection_reason` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `reviews` table
    - Add policies for users to manage their own reviews
    - Add policies for admins to manage all reviews

  3. Constraints
    - Rating must be between 1 and 5
    - Status must be valid enum value
*/

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_text TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON reviews(is_featured);

-- Create trigger for updated_at
CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for reviews table
-- Users can view their own reviews
CREATE POLICY "Users can view own reviews" ON reviews
FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own reviews
CREATE POLICY "Users can insert own reviews" ON reviews
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own reviews (only if pending)
CREATE POLICY "Users can update own pending reviews" ON reviews
FOR UPDATE USING (user_id = auth.uid() AND status = 'pending');

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews" ON reviews
FOR SELECT USING (public.is_admin_rls());

-- Admins can update all reviews
CREATE POLICY "Admins can update all reviews" ON reviews
FOR UPDATE USING (public.is_admin_rls());

-- Admins can delete reviews
CREATE POLICY "Admins can delete reviews" ON reviews
FOR DELETE USING (public.is_admin_rls());

-- Public can view approved reviews (for homepage display)
CREATE POLICY "Public can view approved reviews" ON reviews
FOR SELECT TO anon USING (status = 'approved');