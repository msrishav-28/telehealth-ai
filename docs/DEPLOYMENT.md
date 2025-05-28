# Deployment Guide for TeleHealth AI

This guide covers deploying TeleHealth AI to production using Vercel, setting up the database, and configuring all necessary services.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Redis Setup](#redis-setup)
4. [API Keys Configuration](#api-keys-configuration)
5. [Vercel Deployment](#vercel-deployment)
6. [Post-Deployment](#post-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

- Node.js 18+ installed locally
- Git repository with the project code
- Accounts for:
  - [Vercel](https://vercel.com) (deployment)
  - [Supabase](https://supabase.com) or [Neon](https://neon.tech) (PostgreSQL)
  - [Upstash](https://upstash.com) (Redis)
  - [Clerk](https://clerk.dev) (authentication)
  - [Perplexity](https://perplexity.ai) (API access)
  - [Google AI Studio](https://makersuite.google.com) (Gemini API - FREE!)

## Database Setup

### Option 1: Supabase (Recommended)

1. Create a new Supabase project
2. Go to Settings → Database
3. Copy the connection string (both pooled and direct)
4. Update your `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```

### Option 2: Neon

1. Create a new Neon project
2. Copy the connection string from the dashboard
3. Update your `.env.local` with the connection string

### Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

## Redis Setup

### Using Upstash Redis

1. Create a new Redis database on [Upstash](https://console.upstash.com)
2. Copy the REST URL and token
3. Update your `.env.local`:
   ```env
   UPSTASH_REDIS_REST_URL="https://[YOUR-ENDPOINT].upstash.io"
   UPSTASH_REDIS_REST_TOKEN="[YOUR-TOKEN]"
   ```

## API Keys Configuration

### Perplexity API

1. Sign up at [Perplexity](https://perplexity.ai)
2. Generate an API key from your dashboard
3. Add to `.env.local`:
   ```env
   PERPLEXITY_API_KEY="pplx-[YOUR-KEY]"
   ```

### Google Gemini API (FREE!)

1. Go to [Google AI Studio](https://makersuite.google.com)
2. Sign in with your Google account
3. Click "Get API key" in the left sidebar
4. Create a new API key
5. Add to `.env.local`:
   ```env
   GEMINI_API_KEY="your-api-key-here"
   ```

**Note**: Gemini Pro is free up to 60 requests per minute!

### Clerk Authentication

1. Create a new application on [Clerk Dashboard](https://dashboard.clerk.dev)
2. Choose your authentication methods
3. Copy the API keys:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_[YOUR-KEY]"
   CLERK_SECRET_KEY="sk_[YOUR-KEY]"
   NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
   NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
   ```

## Vercel Deployment

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Connect to Vercel

```bash
vercel login
```

### 3. Initialize Project

```bash
vercel
```

Follow the prompts to:
- Link to existing project or create new
- Configure project settings
- Set up environment variables

### 4. Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.local`
3. Select appropriate environments (Production, Preview, Development)

### 5. Configure Build Settings

In `vercel.json` (create if not exists):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/trpc/[trpc]/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### 6. Deploy to Production

```bash
vercel --prod
```

Or push to your Git repository for automatic deployment.

## Post-Deployment

### 1. Set up Webhooks

Configure Clerk webhooks for user sync:
1. In Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`

### 2. Configure CORS (if needed)

In `next.config.js`, add allowed origins:

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
      ],
    },
  ];
}
```

### 3. Set up Monitoring

1. **Vercel Analytics**: Enable in Vercel Dashboard
2. **Error Tracking**: Set up Sentry
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```
3. **Uptime Monitoring**: Use Better Uptime or Pingdom

### 4. Configure Rate Limiting

Update rate limits for production in your environment variables:

```env
RATE_LIMIT_REQUESTS_PER_MINUTE="20"
RATE_LIMIT_TOKENS_PER_DAY="100000"
```

## Monitoring & Maintenance

### Health Checks

Create `/api/health` endpoint:

```typescript
export async function GET() {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis
    await redis.ping();
    
    return Response.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ 
      status: 'unhealthy',
      error: error.message 
    }, { status: 503 });
  }
}
```

### Database Backups

1. **Supabase**: Automatic daily backups (upgrade for more frequent)
2. **Manual Backup Script**:
   ```bash
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

### Monitoring Checklist

- [ ] API response times < 3s
- [ ] Database query performance
- [ ] Redis cache hit rate > 80%
- [ ] Error rate < 1%
- [ ] API quota usage
- [ ] Security alerts

### Scaling Considerations

1. **Database Connections**: Use connection pooling
2. **Redis Memory**: Monitor usage and upgrade as needed
3. **API Rate Limits**: Adjust based on usage
4. **Edge Functions**: Use for geo-distributed performance

## Security Checklist

- [ ] Environment variables properly set
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] API keys rotated regularly
- [ ] Database backups encrypted
- [ ] Audit logs enabled
- [ ] GDPR/HIPAA compliance reviewed

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check connection string format
   - Verify SSL settings
   - Check connection pool limits

2. **API Rate Limits**
   - Implement caching
   - Use queue for batch processing
   - Upgrade API plans

3. **Build Failures**
   - Check Node version
   - Clear cache: `vercel --force`
   - Review build logs

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- Project Issues: [GitHub Issues](https://github.com/yourusername/telehealth-ai/issues)