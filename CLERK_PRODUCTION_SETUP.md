# Clerk Authentication Setup - Production & Development

## Environment Files

### Production (`frontend/.env.production`)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsubWFnaWsudG9vbHMk
VITE_CLERK_SIGN_IN_URL=https://accounts.magik.tools/sign-in
VITE_CLERK_SIGN_UP_URL=https://accounts.magik.tools/sign-up
```

### Development (`frontend/.env.development`)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsubWFnaWsudG9vbHMk
```

## Clerk Dashboard Configuration

### LIVE Instance (Production)
**URL:** https://dashboard.clerk.com

#### Domains & Allowed Origins
- Add `https://app.magik.tools` to allowed origins
- Add `https://app.magik.tools` to authorized domains

#### Hosted Pages
- **Sign-in URL:** `https://accounts.magik.tools/sign-in`
- **Sign-up URL:** `https://accounts.magik.tools/sign-up`
- **Post-login redirect:** `/dashboard`

#### OAuth Settings (Google)
- Add `https://app.magik.tools` to authorized redirect URIs

### TEST Instance (Development)
**URL:** https://dashboard.clerk.com

#### Domains & Allowed Origins
- Add `https://*.lp.dev` (wildcard pattern)
- Add `http://localhost:5173`
- Add `http://localhost:*` (for other local ports)

#### Hosted Pages
- Use default `*.accounts.dev` hosted pages
- DO NOT configure custom Sign-in/Sign-up URLs for TEST instance

## Build Configuration

### Build Command
```bash
cd frontend && npm ci && npm run build
```

### Output Directory
- `frontend/dist/`

### Environment Loading
- Vite automatically loads `.env.production` in production mode (`--mode production`)
- Vite automatically loads `.env.development` in development mode (`--mode development`)

## Deployment Checklist

### Production (app.magik.tools)
- [ ] Verify `frontend/.env.production` contains `pk_live_*` key
- [ ] Build frontend: `cd frontend && npm run build`
- [ ] Deploy `frontend/dist/` to app.magik.tools
- [ ] Configure SPA fallback: all routes `/*` → `index.html` (200 status)
- [ ] Purge CDN/cache for app.magik.tools
- [ ] Verify Clerk LIVE instance has app.magik.tools in allowed origins
- [ ] Verify hosted pages point to accounts.magik.tools

### Development (*.lp.dev)
- [ ] Verify `frontend/.env.development` contains `pk_test_*` key
- [ ] Build frontend: `cd frontend && npm run build`
- [ ] Verify Clerk TEST instance has *.lp.dev in allowed origins
- [ ] Verify hosted pages use default *.accounts.dev

## Verification

### Production
1. Open https://app.magik.tools
2. Should redirect to https://accounts.magik.tools/sign-in
3. DevTools Console: `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` should show `pk_live_*`
4. Network tab should show requests to:
   - `frontend-api.clerk.services`
   - `accounts.magik.tools`
5. After login, redirect to `/dashboard`

### Development
1. Open preview URL (*.lp.dev)
2. Should redirect to *.accounts.dev sign-in
3. DevTools Console: `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` should show `pk_test_*`
4. Network tab should show requests to:
   - `frontend-api.clerk.services`
   - `*.accounts.dev`
5. After login, redirect to `/dashboard`

## Troubleshooting

### "Development mode" showing in production
- Verify `frontend/.env.production` exists and contains correct keys
- Rebuild frontend with `npm run build` (defaults to production mode)
- Verify build artifact is from latest build
- Clear CDN cache

### Sign-in redirects to wrong URL
- Check Clerk instance (LIVE vs TEST)
- Verify `VITE_CLERK_SIGN_IN_URL` in appropriate `.env` file
- Verify hosted pages configuration in Clerk Dashboard

### Network requests to wrong domain
- Check which publishable key is bundled in build
- Use browser DevTools to inspect `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY`
- `pk_live_*` → production (accounts.magik.tools)
- `pk_test_*` → development (*.accounts.dev)
