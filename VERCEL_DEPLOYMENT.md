# BurnCall - Vercel Deployment Setup Guide

## ✅ Prerequisites Completed

- ✅ Feature branch created: `feature/copilot-plans`
- ✅ Copilot Plans feature implemented
- ✅ API endpoints configured
- ✅ Deployment guide added
- ✅ GitHub Actions workflow configured
- ✅ Vercel configuration added

## 🚀 Step-by-Step Deployment to Vercel

### Step 1: Create Vercel Account

1. Go to https://vercel.com/signup
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your GitHub account

### Step 2: Link Repository to Vercel

```bash
# Option A: Via CLI
npm i -g vercel
vercel login
vercel link

# Option B: Via Web Dashboard
# Go to https://vercel.com/dashboard
# Click "Add New Project"
# Select your GitHub repository
```

### Step 3: Set Environment Variables

**In Vercel Dashboard:**

1. Go to Project Settings → Environment Variables
2. Add the following variables:

```env
NEXT_PUBLIC_API_URL=https://burncall.vercel.app
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret_key_here
COPILOT_PLANS_ENABLED=true
NODE_ENV=production
```

**Local Development (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=your_local_database_url
JWT_SECRET=development_secret_key
COPILOT_PLANS_ENABLED=true
NODE_ENV=development
```

### Step 4: Verify Configuration Files

✅ **vercel.json** - Configured for Next.js
✅ **.github/workflows/deploy-vercel.yml** - CI/CD pipeline ready

### Step 5: Deploy to Production

#### Option A: Deploy via CLI (Immediate)
```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

#### Option B: Deploy via GitHub (Automated)
```bash
# Push feature branch to GitHub
git push origin feature/copilot-plans

# Create Pull Request via GitHub web interface
# https://github.com/wburnsinc/Burncall

# Once PR is merged to main, Vercel will auto-deploy
```

#### Option C: Manual Merge and Deploy
```bash
# Checkout main branch
git checkout main
git pull origin main

# Merge feature branch
git merge feature/copilot-plans

# Push to main
git push origin main

# Vercel will automatically deploy (if connected)
```

### Step 6: Verify Deployment

1. **Check Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Look for your project
   - Should show "Production" deployment

2. **Test API Endpoints:**
   ```bash
   # List plans
   curl https://burncall.vercel.app/api/copilot/plans
   
   # Create plan
   curl -X POST https://burncall.vercel.app/api/copilot/plans \
     -H "Content-Type: application/json" \
     -d '{"name":"My Plan","template":"quick-burn-plan"}'
   ```

3. **Monitor Health:**
   ```bash
   curl https://burncall.vercel.app/api/health
   ```

## 📊 GitHub Actions CI/CD Pipeline

The workflow automatically:

- ✅ Checks out code
- ✅ Installs dependencies
- ✅ Runs linting
- ✅ Runs tests
- ✅ Builds the project
- ✅ Deploys preview for PRs
- ✅ Deploys production on main push
- ✅ Comments on PRs with deployment URL

### Required GitHub Secrets

Set these in GitHub repo Settings → Secrets and variables:

```
VERCEL_TOKEN          - Your Vercel authentication token
VERCEL_ORG_ID         - Your Vercel organization ID
VERCEL_PROJECT_ID     - Your Vercel project ID
```

**How to get these values:**

1. **VERCEL_TOKEN:**
   ```bash
   vercel login
   # Check ~/.vercel/auth.json
   ```

2. **VERCEL_ORG_ID & VERCEL_PROJECT_ID:**
   - Run: `vercel project list`
   - Or find in `.vercel/project.json` after linking

## 🔄 Continuous Deployment Workflow

```
Feature Development
        ↓
Push to GitHub
        ↓
GitHub Actions triggered
        ↓
Tests & Build pass?
        ↓
Deploy to Preview (Vercel)
        ↓
Create Pull Request
        ↓
Review & Approve
        ↓
Merge to main
        ↓
GitHub Actions triggered
        ↓
Deploy to Production (Vercel)
        ↓
✅ Live!
```

## 🎯 Accessing Your Deployed App

Once deployed to Vercel, your app will be available at:

```
https://burncall.vercel.app
https://burncall-wburnsinc.vercel.app (alternative)
https://your-custom-domain.com (if configured)
```

## 🛡️ Security Checklist

- [ ] Environment variables set in Vercel
- [ ] GitHub secrets configured
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] API rate limiting configured
- [ ] Authentication implemented
- [ ] Database credentials secured
- [ ] Sensitive data not in code
- [ ] Regular dependency updates

## 🚨 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
vercel --prod --force

# Check logs
vercel logs
```

### Environment Variables Not Recognized
```bash
# Restart deployment
vercel redeploy
```

### API Endpoints Return 404
- Verify API routes exist
- Check function names match
- Verify environment variables set

### Database Connection Issues
- Verify DATABASE_URL format
- Check firewall/network rules
- Test connection locally first

## 📈 Monitoring & Analytics

**Vercel provides:**
- Real-time deployment logs
- Performance analytics
- Error tracking
- Traffic insights
- Uptime monitoring

Access at: https://vercel.com/dashboard

## 🔗 Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Repository: https://github.com/wburnsinc/Burncall
- Feature Branch: https://github.com/wburnsinc/Burncall/tree/feature/copilot-plans
- API Documentation: See `features/copilot/plans/README.md`

## 📞 Support

For issues with:
- **Vercel deployment**: https://vercel.com/support
- **GitHub Actions**: https://docs.github.com/en/actions
- **BurnCall**: Create issue at https://github.com/wburnsinc/Burncall/issues

---

**Status:** ✅ Ready for Production Deployment
**Last Updated:** 2026-07-03
**Version:** 1.0.0
