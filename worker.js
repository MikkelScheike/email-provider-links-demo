// Cloudflare Worker for Email Provider Links Demo
// Comprehensive Node.js polyfills for Cloudflare Workers
globalThis.__dirname = '/';
globalThis.__filename = '/worker.js';
globalThis.process = globalThis.process || {
  env: { NODE_ENV: 'production' },
  cwd: () => '/'
};

// Polyfill path module functions
globalThis.path = {
  join: (...args) => args.filter(Boolean).join('/').replace(/\/+/g, '/'),
  dirname: (path) => path.split('/').slice(0, -1).join('/') || '/',
  resolve: (...args) => args.filter(Boolean).join('/').replace(/\/+/g, '/')
};

// Cache for provider data
let cachedProviderData = null;

// Polyfill fs module functions
globalThis.fs = {
  existsSync: (path) => {
    // Return true for the providers file path
    return path.includes('emailproviders.json');
  },
  readFileSync: (path, encoding) => {
    // If it's the providers file, return cached data or throw an error to be caught
    if (path.includes('emailproviders.json')) {
      if (cachedProviderData) {
        return cachedProviderData;
      }
      // If no cached data, throw an error that will be handled gracefully
      throw new Error('Provider data not yet loaded');
    }
    return '{}';
  }
};

// Function to load provider data from assets
async function loadProviderData(env) {
  if (!cachedProviderData) {
    try {
      const response = await env.ASSETS.fetch(new Request('https://dummy.com/emailproviders.json'));
      if (response.ok) {
        cachedProviderData = await response.text();
      } else {
        // Fallback data if asset loading fails
        cachedProviderData = JSON.stringify({
          "version": "2.0",
          "providers": [
            {
              "id": "g",
              "name": "Gmail",
              "url": "https://mail.google.com/mail/",
              "domains": ["gmail.com", "googlemail.com"]
            },
            {
              "id": "outlook",
              "name": "Outlook",
              "url": "https://outlook.live.com",
              "domains": ["outlook.com", "hotmail.com", "live.com"]
            },
            {
              "id": "yahoo",
              "name": "Yahoo",
              "url": "https://mail.yahoo.com",
              "domains": ["yahoo.com"]
            }
          ]
        });
      }
    } catch (error) {
      console.warn('Failed to load provider data:', error);
      // Use fallback data
      cachedProviderData = JSON.stringify({
        "version": "2.0",
        "providers": [
          {
            "id": "g",
            "name": "Gmail",
            "url": "https://mail.google.com/mail/",
            "domains": ["gmail.com", "googlemail.com"]
          }
        ]
      });
    }
  }
  return cachedProviderData;
}

import { getEmailProvider } from '@mikkelscheike/email-provider-links';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // API endpoint for email provider detection
    if (url.pathname === '/api/detect-provider' && request.method === 'POST') {
      try {
        // Preload provider data before processing request
        await loadProviderData(env);
        
        const { email, timeout = 5000 } = await request.json();
        
        if (!email) {
          return new Response(JSON.stringify({ error: 'Email is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log(`🔍 Detecting provider for: ${email}`);
        
        const startTime = Date.now();
        const result = await getEmailProvider(email, timeout);
        const detectionTime = Date.now() - startTime;
        
        console.log(`✅ Detection complete in ${detectionTime}ms:`, result);
        
        // Add timing information for demo purposes
        const response = {
          ...result,
          _meta: {
            detectionTime: `${detectionTime}ms`,
            timestamp: new Date().toISOString(),
            apiVersion: '2.4.0'
          }
        };
        
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('❌ Error detecting email provider:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to detect email provider',
          details: error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Icon endpoint - serves SVG icons
    if (url.pathname.startsWith('/api/icon/')) {
      const iconName = url.pathname.split('/api/icon/')[1];
      const color = url.searchParams.get('color') || '000000';
      
      try {
        // Handle custom Microsoft Outlook icon
        if (iconName.toLowerCase() === 'outlook' || iconName.toLowerCase() === 'microsoft') {
          // For Workers, we'll need to handle this differently or use simple-icons
          // This is a simplified SVG for Outlook
          const outlookSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#${color}">
            <path d="M7 9c0-1.65 1.35-3 3-3s3 1.35 3 3v6c0 1.65-1.35 3-3 3s-3-1.35-3-3V9zm5-7v4.87C11.35 6.34 10.7 6 10 6c-2.21 0-4 1.79-4 4v4c0 2.21 1.79 4 4 4 .7 0 1.35-.34 1.65-.87V20h8V2h-6.65z"/>
          </svg>`;
          
          return new Response(outlookSvg, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'image/svg+xml',
              'Cache-Control': 'public, max-age=86400'
            }
          });
        }
        
        // For other icons, return a generic email icon
        const genericSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#${color}">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>`;
        
        return new Response(genericSvg, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      } catch (error) {
        console.error('Error serving icon:', error);
        return new Response(JSON.stringify({ error: 'Failed to serve icon' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Health check endpoint
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ 
        status: 'healthy', 
        service: 'email-provider-links-demo',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Serve static files
    return env.ASSETS.fetch(request);
  },
};
