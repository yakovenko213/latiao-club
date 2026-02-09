// ============================================
// LATIAO SNACK - Cloudflare Geo Worker
// Returns visitor's city and region from Cloudflare headers
// Deploy to Cloudflare Workers: https://workers.cloudflare.com
// ============================================

export default {
  async fetch(request, env, ctx) {
    // CORS headers for cross-origin requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store', // Don't cache geo data
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Get Cloudflare geolocation from request headers
    // Cloudflare automatically adds these headers when proxying requests
    const cf = request.cf || {};
    
    // Extract geo data from Cloudflare's cf object
    const geoData = {
      // City name (e.g., "Київ", "Львів", "Одеса")
      city: cf.city || request.headers.get('cf-ipcity') || 'Unknown',
      
      // Region/Oblast (e.g., "Kyiv City", "Lviv Oblast")
      region: cf.region || request.headers.get('cf-region') || 'Unknown',
      
      // Region code (e.g., "30" for Kyiv)
      regionCode: cf.regionCode || request.headers.get('cf-region-code') || null,
      
      // Country (should be "UA" for Ukraine)
      country: cf.country || request.headers.get('cf-ipcountry') || 'Unknown',
      
      // Additional useful data
      timezone: cf.timezone || null,
      postalCode: cf.postalCode || null,
      
      // Debug: request timestamp
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(geoData), {
      headers: corsHeaders,
    });
  },
};
