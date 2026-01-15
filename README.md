# RecruiterRank

A recruitment company review platform built with Next.js 14, Supabase, and Tailwind CSS.

## Features

- **Company Profiles**: Browse and search recruitment companies with detailed profiles
- **Reviews System**: Star ratings for Communication, Candidate Care, Job Quality, and Process Speed
- **User Authentication**: Email/password signup and login via Supabase Auth
- **Company Verification**: Email domain verification or manual review for company owners
- **Owner Dashboard**: Verified owners can edit profiles and respond to reviews
- **Admin Panel**: Moderation tools for reviews and verification requests
- **SEO Optimized**: Dynamic meta tags and structured data (JSON-LD)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase account

### Setup

1. Clone the repository:
```bash
git clone <repo-url>
cd recruiter-ranking
```

2. Install dependencies:
```bash
npm install
```

3. Create a Supabase project at [supabase.com](https://supabase.com)

4. Run the database schema:
   - Go to SQL Editor in Supabase Dashboard
   - Run `supabase/schema.sql`
   - Run `supabase/seed.sql` for sample data

5. Configure environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
RESEND_API_KEY=your-resend-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── account/           # User account pages
│   ├── admin/             # Admin panel
│   ├── companies/         # Company listing and profiles
│   └── verify/            # Email verification
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
├── lib/
│   ├── actions/          # Server actions
│   ├── supabase/         # Supabase client setup
│   ├── constants.ts      # App constants
│   └── utils.ts          # Utility functions
├── hooks/                # React hooks
└── types/                # TypeScript types
```

## Database Schema

See `supabase/schema.sql` for the complete database schema including:

- `companies` - Company profiles
- `reviews` - User reviews with ratings
- `review_responses` - Owner responses to reviews
- `profiles` - User profiles (extends Supabase auth)
- `claim_requests` - Company verification requests
- `helpful_votes` - Review helpfulness votes

## Key Routes

- `/` - Homepage with featured companies
- `/companies` - Browse all companies with filters
- `/companies/[slug]` - Company profile with reviews
- `/companies/[slug]/review` - Write a review
- `/companies/[slug]/claim` - Claim company ownership
- `/companies/[slug]/manage` - Owner dashboard
- `/account` - User account page
- `/admin` - Admin panel (admin only)

## Making a User an Admin

To make a user an admin, update their profile in Supabase:

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'admin@example.com';
```

## Email Setup (Resend)

For production email delivery:

1. Sign up at [resend.com](https://resend.com)
2. Add your domain and verify it
3. Create an API key
4. Add `RESEND_API_KEY` to your environment variables

The current MVP logs verification links to the console. For production, implement the email sending in `src/lib/actions/claims.ts`.

## License

MIT
