# Setup Instructions

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting Supabase Credentials

1. **Create a Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in your project details (name, database password, region)
   - Wait for the project to be created

2. **Get API Credentials**
   - Go to Project Settings > API
   - Copy the **Project URL** to `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the **anon/public** key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Set Up Database**
   - Go to SQL Editor in your Supabase dashboard
   - Create a new query
   - Copy and paste the contents of `supabase/schema.sql`
   - Click "Run" to execute
   - Create another new query
   - Copy and paste the contents of `supabase/rls-policies.sql`
   - Click "Run" to execute

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## First Steps

1. Navigate to `/signup` to create an account
2. Check your email for verification link
3. Log in at `/login`
4. Explore the dashboard and inventory pages

## Troubleshooting

**"Supabase client error"**
- Make sure your `.env.local` file exists
- Verify your Supabase URL and key are correct
- Restart the development server

**"Database error"**
- Make sure you've run both SQL scripts in Supabase
- Check that RLS policies are enabled
- Verify your user is authenticated

**Build errors**
- Delete `.next` folder and rebuild
- Clear npm cache: `npm cache clean --force`
- Reinstall dependencies: `rm -rf node_modules && npm install`
