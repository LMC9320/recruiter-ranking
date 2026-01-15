-- Recruiter Ranking Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE reviewer_type AS ENUM ('candidate', 'hiring_manager');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE verification_type AS ENUM ('email', 'manual');
CREATE TYPE proof_type AS ENUM ('companies_house', 'official_documentation', 'other');
CREATE TYPE company_size AS ENUM ('1-10', '11-50', '51-200', '201-500', '500+');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  website_domain TEXT,
  sectors TEXT[] DEFAULT '{}',
  locations TEXT[] DEFAULT '{}',
  size company_size,
  is_verified BOOLEAN DEFAULT FALSE,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  average_rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0
);

-- Create index for slug lookups
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_sectors ON companies USING GIN(sectors);
CREATE INDEX idx_companies_locations ON companies USING GIN(locations);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating_communication INTEGER NOT NULL CHECK (rating_communication >= 1 AND rating_communication <= 5),
  rating_candidate_care INTEGER NOT NULL CHECK (rating_candidate_care >= 1 AND rating_candidate_care <= 5),
  rating_job_quality INTEGER NOT NULL CHECK (rating_job_quality >= 1 AND rating_job_quality <= 5),
  rating_speed INTEGER NOT NULL CHECK (rating_speed >= 1 AND rating_speed <= 5),
  overall_rating DECIMAL(3,2) NOT NULL,
  pros TEXT NOT NULL,
  cons TEXT NOT NULL,
  summary TEXT NOT NULL,
  reviewer_type reviewer_type NOT NULL,
  status review_status DEFAULT 'approved',
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

CREATE INDEX idx_reviews_company ON reviews(company_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_status ON reviews(status);

-- Review responses table (owner replies)
CREATE TABLE review_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id) -- Only one response per review
);

-- Claim requests table
CREATE TABLE claim_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verification_type verification_type NOT NULL,
  email_used TEXT,
  token TEXT UNIQUE,
  token_expires_at TIMESTAMPTZ,
  full_name TEXT,
  job_title TEXT,
  linkedin_url TEXT,
  proof_text TEXT,
  proof_type proof_type,
  status claim_status DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_claim_requests_token ON claim_requests(token);
CREATE INDEX idx_claim_requests_status ON claim_requests(status);
CREATE INDEX idx_claim_requests_company ON claim_requests(company_id);

-- Helpful votes table
CREATE TABLE helpful_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Function to extract domain from website URL
CREATE OR REPLACE FUNCTION extract_domain(url TEXT)
RETURNS TEXT AS $$
BEGIN
  IF url IS NULL OR url = '' THEN
    RETURN NULL;
  END IF;
  RETURN regexp_replace(
    regexp_replace(url, '^https?://(www\.)?', ''),
    '/.*$', ''
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-extract website domain on company insert/update
CREATE OR REPLACE FUNCTION update_website_domain()
RETURNS TRIGGER AS $$
BEGIN
  NEW.website_domain := extract_domain(NEW.website);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_website_domain
  BEFORE INSERT OR UPDATE OF website ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_website_domain();

-- Function to update company average rating and review count
CREATE OR REPLACE FUNCTION update_company_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE companies
    SET
      average_rating = (
        SELECT AVG(overall_rating)
        FROM reviews
        WHERE company_id = OLD.company_id AND status = 'approved'
      ),
      review_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE company_id = OLD.company_id AND status = 'approved'
      ),
      updated_at = NOW()
    WHERE id = OLD.company_id;
    RETURN OLD;
  ELSE
    UPDATE companies
    SET
      average_rating = (
        SELECT AVG(overall_rating)
        FROM reviews
        WHERE company_id = NEW.company_id AND status = 'approved'
      ),
      review_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE company_id = NEW.company_id AND status = 'approved'
      ),
      updated_at = NOW()
    WHERE id = NEW.company_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_company_rating();

-- Function to update helpful count
CREATE OR REPLACE FUNCTION update_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE reviews
    SET helpful_count = helpful_count - 1
    WHERE id = OLD.review_id;
    RETURN OLD;
  ELSE
    UPDATE reviews
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_helpful_count
  AFTER INSERT OR DELETE ON helpful_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_helpful_count();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE helpful_votes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Companies policies
CREATE POLICY "Companies are viewable by everyone"
  ON companies FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert companies"
  ON companies FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Owners and admins can update companies"
  ON companies FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete companies"
  ON companies FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Reviews policies
CREATE POLICY "Approved reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Review responses policies
CREATE POLICY "Responses are viewable by everyone"
  ON review_responses FOR SELECT
  USING (true);

CREATE POLICY "Company owners can insert responses"
  ON review_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reviews r
      JOIN companies c ON r.company_id = c.id
      WHERE r.id = review_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Response authors can update their responses"
  ON review_responses FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Response authors can delete their responses"
  ON review_responses FOR DELETE
  USING (user_id = auth.uid());

-- Claim requests policies
CREATE POLICY "Users can view their own claim requests"
  ON claim_requests FOR SELECT
  USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Authenticated users can create claim requests"
  ON claim_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update claim requests"
  ON claim_requests FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Helpful votes policies
CREATE POLICY "Votes are viewable by everyone"
  ON helpful_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON helpful_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own votes"
  ON helpful_votes FOR DELETE
  USING (user_id = auth.uid());
