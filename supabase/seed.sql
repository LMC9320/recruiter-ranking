-- Seed data for Recruiter Ranking
-- Run this after schema.sql to populate with test companies

INSERT INTO companies (name, slug, description, website, sectors, locations, size) VALUES
(
  'Heidrick & Struggles',
  'heidrick-struggles',
  'Global executive search and leadership consulting firm specializing in C-suite and board-level placements. Known for their rigorous assessment process and deep industry expertise.',
  'https://www.heidrick.com',
  ARRAY['Executive Search', 'Leadership Consulting', 'Board Services'],
  ARRAY['London', 'Manchester', 'Edinburgh'],
  '500+'
),
(
  'Robert Half',
  'robert-half',
  'Leading specialist recruitment consultancy covering finance, technology, legal and administrative roles. Offers both permanent and temporary staffing solutions with a strong focus on professional services.',
  'https://www.roberthalf.co.uk',
  ARRAY['Finance', 'Technology', 'Legal', 'Administrative'],
  ARRAY['London', 'Birmingham', 'Leeds', 'Bristol'],
  '500+'
),
(
  'Oakleaf Partnership',
  'oakleaf-partnership',
  'Boutique HR recruitment specialist focused on placing HR professionals across all levels. Known for their consultative approach and deep understanding of the HR market.',
  'https://www.oakleafpartnership.com',
  ARRAY['Human Resources', 'Talent Acquisition', 'People Operations'],
  ARRAY['London', 'Remote'],
  '11-50'
),
(
  'PE Recruit',
  'pe-recruit',
  'Specialist private equity and venture capital recruitment firm. Expert in placing investment professionals, operating partners, and portfolio company executives.',
  'https://www.perecruit.com',
  ARRAY['Private Equity', 'Venture Capital', 'Investment Banking'],
  ARRAY['London', 'Cambridge'],
  '11-50'
),
(
  'Goodman Masson',
  'goodman-masson',
  'Award-winning recruitment agency specialising in finance, technology, and HR roles. Recognised for their commitment to diversity and inclusion in recruitment practices.',
  'https://www.goodmanmasson.com',
  ARRAY['Finance', 'Technology', 'Human Resources'],
  ARRAY['London', 'Dusseldorf', 'New York'],
  '51-200'
),
(
  'Sheffield Haworth',
  'sheffield-haworth',
  'Executive search firm focused on financial services, investment management, and fintech. Strong track record in placing senior professionals in asset management and banking.',
  'https://www.sheffieldhaworth.com',
  ARRAY['Financial Services', 'Investment Management', 'Fintech'],
  ARRAY['London', 'Hong Kong', 'New York'],
  '51-200'
),
(
  'Morgan McKinley',
  'morgan-mckinley',
  'Global professional services recruitment firm with expertise in banking, financial services, and professional services. Offers executive search and contract staffing.',
  'https://www.morganmckinley.com',
  ARRAY['Banking', 'Financial Services', 'Professional Services'],
  ARRAY['London', 'Dublin', 'Hong Kong', 'Singapore'],
  '201-500'
),
(
  'Dartmouth Partners',
  'dartmouth-partners',
  'Boutique search firm specialising in strategy consulting, private equity, and corporate development roles. Known for their candidate-centric approach and industry expertise.',
  'https://www.dartmouthpartners.com',
  ARRAY['Strategy Consulting', 'Private Equity', 'Corporate Development'],
  ARRAY['London'],
  '11-50'
),
(
  'Leathwaite',
  'leathwaite',
  'Executive search and talent solutions firm focusing on HR, legal, and corporate functions. Pioneers in data-driven talent assessment and succession planning.',
  'https://www.leathwaite.com',
  ARRAY['Human Resources', 'Legal', 'Corporate Functions'],
  ARRAY['London', 'New York', 'Hong Kong'],
  '51-200'
),
(
  'Michael Page',
  'michael-page',
  'One of the world''s leading professional recruitment consultancies. Offers recruitment services across a wide range of sectors with a focus on mid to senior-level positions.',
  'https://www.michaelpage.co.uk',
  ARRAY['Finance', 'Technology', 'Legal', 'Marketing', 'Engineering'],
  ARRAY['London', 'Manchester', 'Birmingham', 'Bristol', 'Edinburgh', 'Leeds'],
  '500+'
);

-- Note: Reviews would typically be added by authenticated users through the app
-- The following is example data for demonstration purposes only

-- To add test reviews, you would need to:
-- 1. Create test users through Supabase Auth
-- 2. Insert reviews with valid user_id references
