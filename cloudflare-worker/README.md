# Cloudflare Geo Worker Deployment

This Cloudflare Worker returns visitor geolocation data using Cloudflare's built-in headers.

## Prerequisites

1. A Cloudflare account (free tier works)
2. Wrangler CLI installed: `npm install -g wrangler`
3. Authenticated with Cloudflare: `wrangler login`

## Deployment Steps

### 1. Navigate to the worker directory
```bash
cd cloudflare-worker
```

### 2. Deploy to Cloudflare Workers
```bash
npx wrangler deploy
```

### 3. Get your worker URL
After deployment, you'll see output like:
```
Published latiao-geo-api (1.23 sec)
  https://latiao-geo-api.<your-subdomain>.workers.dev
```

### 4. Update the frontend tracker
Edit `/public-site/js/visitor-tracker.js` and update the worker URL:
```javascript
const CLOUDFLARE_GEO_WORKER_URL = 'https://latiao-geo-api.<your-subdomain>.workers.dev';
```

### 5. Deploy to Firebase
```bash
firebase deploy --only hosting:main
```

## Testing

Open browser DevTools console and visit your site. You should see:
```
✅ Cloudflare Geo success: { city: "Київ", region: "Kyiv City", ... }
```

If the worker is unavailable, it falls back to ip-api.com:
```
⚠️ Cloudflare Worker unavailable, trying fallback...
✅ ip-api.com fallback success: { city: "Kyiv", regionName: "Kyiv City" }
```

## Custom Domain (Optional)

To use a custom domain like `geo.latiao.store`:

1. Edit `wrangler.toml`:
```toml
routes = [
  { pattern = "geo.latiao.store/*", zone_name = "latiao.store" }
]
```

2. Add DNS record in Cloudflare:
   - Type: AAAA
   - Name: geo
   - Content: 100::
   - Proxy: Proxied

3. Redeploy: `npx wrangler deploy`

## API Response

The worker returns JSON with the following fields:
```json
{
  "city": "Київ",
  "region": "Kyiv City",
  "regionCode": "30",
  "country": "UA",
  "timezone": "Europe/Kiev",
  "postalCode": "01001",
  "timestamp": "2026-02-08T12:00:00.000Z"
}
```

## Notes

- Cloudflare's geo data is accurate and doesn't require external APIs
- Data is based on the visitor's IP address as seen by Cloudflare
- No rate limits (unlike ip-api.com)
- HTTPS by default
- Free tier includes 100,000 requests/day
