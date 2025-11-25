# Mership - Reshipping Platform

A modern reshipping platform built with Next.js 15, Supabase, and shadcn/ui.

## Features

- 🔐 **Authentication** - Complete auth flow with login, signup, and password reset
- 📊 **Dashboard** - Analytics dashboard with stats cards and visitor charts
- 📦 **Inventory Management** - Manage inventory items with search and filtering
- 🎨 **Modern UI** - Dark mode with shadcn/ui components
- 🔒 **Secure** - Row Level Security (RLS) with Supabase
- 📱 **Responsive** - Mobile-friendly design

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS v3
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd mership
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the database schema:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and run the contents of `supabase/schema.sql`
   - Copy and run the contents of `supabase/rls-policies.sql`

3. Get your project credentials:
   - Go to Project Settings > API
   - Copy the Project URL and anon/public key
   - Add them to your `.env.local` file

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
mership/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication pages
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/     # Dashboard pages
│   │   │   ├── dashboard/
│   │   │   └── inventory/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── stats-card.tsx
│   │   └── visitor-chart.tsx
│   ├── lib/
│   │   ├── supabase/        # Supabase configuration
│   │   └── utils.ts
│   └── middleware.ts        # Auth middleware
├── supabase/
│   ├── schema.sql           # Database schema
│   └── rls-policies.sql     # Security policies
└── public/
```

## Features Overview

### Authentication
- Email/password authentication
- Email verification
- Password reset flow
- Protected routes with middleware

### Dashboard
- Revenue statistics
- Customer metrics
- Active accounts tracking
- Growth rate indicators
- Visitor analytics with time period filters

### Inventory Management
- Add/edit/delete inventory items
- Search and filter functionality
- Stock status tracking
- Category management

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `NEXT_PUBLIC_APP_URL` | Your application URL |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.
