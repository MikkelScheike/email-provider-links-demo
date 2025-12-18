import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { getEmailProvider } from '@mikkelscheike/email-provider-links';
import * as simpleIcons from 'simple-icons';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);

function getEmailProviderLinksVersion() {
    try {
        const pkgPath = require.resolve('@mikkelscheike/email-provider-links/package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        return pkg.version || null;
    } catch {
        return null;
    }
}

const emailProviderLinksVersion = getEmailProviderLinksVersion();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// API endpoint for email provider detection
app.post('/api/detect-provider', async (req, res) => {
    try {
        const { email, timeout = 5000 } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
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
                libraryVersion: emailProviderLinksVersion
            }
        };
        
        res.json(response);
    } catch (error) {
        console.error('❌ Error detecting email provider:', error);
        res.status(500).json({ 
            error: 'Failed to detect email provider',
            details: error.message 
        });
    }
});

// Icon endpoint - serves SVG icons from simple-icons or custom files
app.get('/api/icon/:iconName', (req, res) => {
    try {
        const { iconName } = req.params;
        const { color = '000000' } = req.query;
        
        // Handle custom Microsoft Outlook icon
        if (iconName.toLowerCase() === 'outlook' || iconName.toLowerCase() === 'microsoft') {
            const customSvgPath = path.join(__dirname, 'microsoftoutlook.svg');
            
            if (fs.existsSync(customSvgPath)) {
                let svg = fs.readFileSync(customSvgPath, 'utf8');
                
                // Apply custom color if needed
                if (color !== '000000') {
                    svg = svg.replace(/fill="[^"]*"/g, `fill="#${color}"`);
                }
                
                res.setHeader('Content-Type', 'image/svg+xml');
                res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
                res.send(svg);
                return;
            }
        }
        
        // Map provider names to simple-icons names for other providers
        const iconMap = {
            'gmail': 'siGmail',
            'google': 'siGoogle',
            'yahoo': 'siYahoo',
            'protonmail': 'siProtonmail',
            'icloud': 'siIcloud',
            'apple': 'siApple',
            'tutanota': 'siTutanota',
            'fastmail': 'siFastmail',
            'zoho': 'siZoho',
            'aol': 'siAol',
            'gmx': 'siGmx',
            'simplelogin': 'siSimplelogin',
            'firefox': 'siFirefox',
            'duckduckgo': 'siDuckduckgo',
            'cloudflare': 'siCloudflare'
        };
        
        const iconKey = iconMap[iconName.toLowerCase()];
        
        if (iconKey && simpleIcons[iconKey]) {
            const icon = simpleIcons[iconKey];
            let svg = icon.svg;
            
            // Apply custom color
            if (color !== '000000') {
                svg = svg.replace(/fill="[^"]*"/g, `fill="#${color}"`);
            }
            
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
            res.send(svg);
        } else {
            res.status(404).json({ error: 'Icon not found' });
        }
    } catch (error) {
        console.error('Error serving icon:', error);
        res.status(500).json({ error: 'Failed to serve icon' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'email-provider-link-demo',
        timestamp: new Date().toISOString()
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Email Provider Links Demo Server running at http://localhost:${PORT}`);
    console.log(`📧 Using @mikkelscheike/email-provider-links library`);
    console.log(`🔗 API endpoint: http://localhost:${PORT}/api/detect-provider`);
    console.log('\n🧪 Try these test emails:');
    console.log('   - john@gmail.com (Gmail)');
    console.log('   - jane@outlook.com (Microsoft Outlook)');
    console.log('   - user@yahoo.com (Yahoo Mail)');
    console.log('   - test@protonmail.com (ProtonMail)');
    console.log('   - business@yourcompany.com (Business domain detection)\n');
});
