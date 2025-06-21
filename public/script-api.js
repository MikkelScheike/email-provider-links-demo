// Frontend JavaScript that calls the real API backend
// This now uses the actual @mikkelscheike/email-provider-links library via the server

// DOM elements
const emailInput = document.getElementById('email');
const providerDetection = document.getElementById('providerDetection');
const signupForm = document.getElementById('signupForm');
const signupBtn = document.getElementById('signupBtn');
const resultsSection = document.getElementById('resultsSection');

// State
let currentDetectedProvider = null;
let detectionTimeout = null;

// Provider logos mapping
const providerLogos = {
    'Gmail': '📧',
    'Microsoft Outlook': '📬',
    'Yahoo Mail': '📮',
    'ProtonMail': '🔒',
    'iCloud Mail': '🍎',
    'Tutanota': '🛡️',
    'FastMail': '⚡',
    'Zoho Mail': '📊',
    'AOL Mail': '📪',
    'GMX': '📫',
    'Google Workspace': '🏢',
    'Microsoft 365': '🏬',
    'Amazon WorkMail': '📦',
    // Proxy/Alias Services
    'SimpleLogin': '🎭',
    'AnonAddy': '🕶️',
    'Firefox Relay': '🦊',
    'DuckDuckGo': '🦆',
    'Hide My Email': '🍎',
    'default': '📧'
};

// Check if a provider is a proxy/alias service
function isProxyService(provider) {
    if (!provider || !provider.companyProvider) return false;
    
    const proxyServices = [
        'SimpleLogin', 'AnonAddy', 'Firefox Relay', 'DuckDuckGo', 
        'Hide My Email', 'Relay', 'Alias', 'Cloudflare'
    ];
    
    return proxyServices.some(service => 
        provider.companyProvider.toLowerCase().includes(service.toLowerCase())
    );
}

// Get provider logo as SVG
function getProviderLogo(provider, size = 24) {
    if (!provider) return `<div class="provider-icon fallback">📧</div>`;
    
    // Map provider names to icon names
    const iconMap = {
        'Gmail': 'gmail',
        'Google Workspace': 'google',
        'Microsoft Outlook': 'outlook',
        'Microsoft 365': 'microsoft',
        'Microsoft 365 (Business)': 'microsoft',
        'Yahoo Mail': 'yahoo',
        'ProtonMail': 'protonmail',
        'iCloud Mail': 'icloud',
        'Tutanota': 'tutanota',
        'FastMail': 'fastmail',
        'Zoho Mail': 'zoho',
        'AOL Mail': 'aol',
        'GMX': 'gmx',
        'SimpleLogin': 'simplelogin',
        'Firefox Relay': 'firefox',
        'DuckDuckGo': 'duckduckgo',
        'Cloudflare': 'cloudflare'
    };
    
    const iconName = iconMap[provider.companyProvider];
    
    if (iconName) {
        return `<img src="/api/icon/${iconName}" alt="${provider.companyProvider}" class="provider-icon svg" width="${size}" height="${size}">`;
    }
    
    // Fallback to emoji for unknown providers
    const fallbackEmojis = {
        'Amazon WorkMail': '📦',
        'Hide My Email': '🍎',
        'AnonAddy': '🕶️'
    };
    
    const emoji = fallbackEmojis[provider.companyProvider] || '📧';
    return `<div class="provider-icon fallback">${emoji}</div>`;
}

// Call the API to detect email provider
async function detectEmailProvider(email, timeout = 5000) {
    try {
        const response = await fetch('/api/detect-provider', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, timeout })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error calling API:', error);
        throw error;
    }
}

// Show provider detection UI
function showProviderDetection(type, provider = null, detectionMethod = null, meta = null) {
    let content = '';
    
    switch (type) {
        case 'detecting':
            content = `
                <div class="provider-info detecting">
                    <div class="provider-logo">🔍</div>
                    <div class="provider-details">
                        <div class="provider-name">Detecting email provider...</div>
                        <div class="provider-subtitle">Using real DNS lookups</div>
                    </div>
                </div>
            `;
            break;
            
        case 'detected':
            const logo = getProviderLogo(provider);
            const isBusinessEmail = detectionMethod && detectionMethod !== 'domain_match';
            const isProxy = isProxyService(provider);
            
            let cssClass = 'detected';
            if (isProxy) {
                cssClass = 'detected proxy';
            } else if (isBusinessEmail) {
                cssClass = 'detected business';
            }
            
            let subtitle = 'Consumer email provider';
            if (isProxy) {
                subtitle = 'Email alias/proxy service';
            } else if (isBusinessEmail) {
                subtitle = 'Business email detected via ' + detectionMethod.replace('_', ' ');
            }
            
            let methodDisplay = '';
            if (detectionMethod && detectionMethod !== 'domain_match') {
                methodDisplay = `<div class="detection-method">${detectionMethod.replace('_', ' ')}</div>`;
            }
            
            // Add timing info if available
            let timingInfo = '';
            if (meta && meta.detectionTime) {
                timingInfo = `<div class="detection-method">${meta.detectionTime}</div>`;
            }
            
            content = `
                <div class="provider-info ${cssClass}">
                    <div class="provider-logo">${logo}</div>
                    <div class="provider-details">
                        <div class="provider-name">${provider.companyProvider}</div>
                        <div class="provider-subtitle">${subtitle}</div>
                    </div>
                    ${methodDisplay}
                    ${timingInfo}
                </div>
            `;
            break;
            
        case 'not_found':
            content = `
                <div class="provider-info">
                    <div class="provider-logo">❓</div>
                    <div class="provider-details">
                        <div class="provider-name">Unknown provider</div>
                        <div class="provider-subtitle">Not found in library database</div>
                    </div>
                </div>
            `;
            break;
            
        case 'error':
            content = `
                <div class="provider-info" style="border-color: #ef4444; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);">
                    <div class="provider-logo">⚠️</div>
                    <div class="provider-details">
                        <div class="provider-name">Detection failed</div>
                        <div class="provider-subtitle">Network or server error</div>
                    </div>
                </div>
            `;
            break;
    }
    
    providerDetection.innerHTML = content;
}

// Clear provider detection
function clearProviderDetection() {
    providerDetection.innerHTML = '';
    currentDetectedProvider = null;
}

// Clear provider detection UI only (preserve data state)
function clearProviderDetectionUI() {
    providerDetection.innerHTML = '';
    // Don't clear currentDetectedProvider - we need it for results
}

// Clear results section
function clearResults() {
    resultsSection.innerHTML = '';
}

// Button state management
function disableSubmitButton(text = 'See result') {
    signupBtn.disabled = true;
    signupBtn.style.opacity = '0.6';
    signupBtn.style.cursor = 'not-allowed';
    signupBtn.querySelector('.btn-text').textContent = text;
}

function enableSubmitButton(text = 'See result') {
    signupBtn.disabled = false;
    signupBtn.style.opacity = '1';
    signupBtn.style.cursor = 'pointer';
    signupBtn.querySelector('.btn-text').textContent = text;
}

// Handle email input changes
function handleEmailChange() {
    console.log('🎯 handleEmailChange called with value:', emailInput.value);
    const email = emailInput.value.trim();
    
    // Clear previous timeout
    if (detectionTimeout) {
        clearTimeout(detectionTimeout);
    }
    
    // Clear detection and results if email is empty or invalid
    if (!email || !email.includes('@')) {
        clearProviderDetection();
        clearResults();
        enableSubmitButton();
        return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        // Only clear if we currently have content to avoid unnecessary DOM changes
        if (providerDetection.innerHTML.trim() !== '') {
            clearProviderDetection();
        }
        enableSubmitButton();
        return;
    }
    
    // Show detecting state and disable button for all domains
    const domain = email.split('@')[1].toLowerCase();
    const commonDomains = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'protonmail.com', 'proton.me', 'yahoo.com', 'aol.com'];
    
    // Always show detecting state and disable button during detection
    showProviderDetection('detecting');
    disableSubmitButton('Detecting provider...');
    
    // Determine timeout based on domain type
    const isCommonDomain = commonDomains.includes(domain);
    const detectionDelay = isCommonDomain ? 100 : 250; // Faster for common domains
    
    // Debounce the detection
    detectionTimeout = setTimeout(async () => {
        try {
            console.log('🔍 Detecting provider for:', email);
            const result = await detectEmailProvider(email, 3000); // 3 second timeout for demo
            console.log('✅ Detection result:', result);
            console.log('✅ Provider found:', result.provider);
            console.log('✅ Detection method:', result.detectionMethod);
            
            if (result.provider) {
                currentDetectedProvider = result;
                console.log('✅ Showing detected provider:', result.provider.companyProvider);
                showProviderDetection('detected', result.provider, result.detectionMethod, result._meta);
            } else if (result.proxyService) {
                // Handle proxy service detection (like Cloudflare)
                currentDetectedProvider = result;
                const proxyProvider = {
                    companyProvider: result.proxyService
                };
                console.log('✅ Showing detected proxy service:', result.proxyService);
                showProviderDetection('detected', proxyProvider, result.detectionMethod, result._meta);
            } else {
                currentDetectedProvider = result;
                console.log('⚠️ No provider found, showing not_found state');
                showProviderDetection('not_found');
            }
            
            // Re-enable the button after detection completes
            enableSubmitButton();
        } catch (error) {
            console.error('❌ Error detecting email provider:', error);
            currentDetectedProvider = null;
            showProviderDetection('error');
            enableSubmitButton(); // Enable even on error
        }
    }, detectionDelay); // Use dynamic delay based on domain type
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const email = emailInput.value.trim();
    if (!email) return;
    
    console.log('📝 Form submitted for email:', email);
    console.log('📝 Current detected provider state:', currentDetectedProvider);
    
    // If we don't have a current provider state, try to detect it again
    if (!currentDetectedProvider) {
        console.log('⚠️ No current provider state, detecting again...');
        try {
            const result = await detectEmailProvider(email, 3000);
            currentDetectedProvider = result;
            console.log('✅ Re-detected provider:', result);
        } catch (error) {
            console.error('❌ Re-detection failed:', error);
        }
    }
    
    // Show loading state
    signupBtn.classList.add('loading');
    
    // Simulate signup process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Hide loading state
    signupBtn.classList.remove('loading');
    
    // Show inline results in the provider detection area (no need to clear first)
    showInlineResults(email);
}

// Show inline results in the provider detection area
function showInlineResults(email) {
    // Add smooth transition by fading out current content first
    providerDetection.style.opacity = '0.5';
    
    // Small delay to allow fade effect, then update content
    setTimeout(() => {
        let content = '';
    
    if (currentDetectedProvider && (currentDetectedProvider.provider || currentDetectedProvider.proxyService)) {
        const provider = currentDetectedProvider.provider || {
            companyProvider: currentDetectedProvider.proxyService
        };
        const logo = getProviderLogo(provider, 36);
        const isBusinessEmail = currentDetectedProvider.detectionMethod && 
                               currentDetectedProvider.detectionMethod !== 'domain_match';
        const isProxy = isProxyService(provider);
        
        let cardClass = '';
        if (isProxy) {
            cardClass = 'proxy';
        } else if (isBusinessEmail) {
            cardClass = 'business';
        }
        
        // Format the full result object for display (clean up the response for display)
        const displayResult = { ...currentDetectedProvider };
        delete displayResult._meta; // Remove meta from main display
        
        const resultData = JSON.stringify(displayResult, null, 2);
        
        // Add meta information separately
        let metaInfo = '';
        if (currentDetectedProvider._meta) {
            metaInfo = `
                <div style="margin-top: 1rem; padding: 0.5rem; background: rgba(0,0,0,0.05); border-radius: 6px; font-size: 0.8rem;">
                    <strong>Detection Time:</strong> ${currentDetectedProvider._meta.detectionTime} | 
                    <strong>API Version:</strong> ${currentDetectedProvider._meta.apiVersion}
                </div>
            `;
        }
        
        content = `
            <div class="results-card ${cardClass}">
                <div class="results-header">
                    <div class="results-icon">${logo}</div>
                    <div class="results-title">
                        <h3>Found Your Email Provider</h3>
                        <p>Email provider detected: ${provider.companyProvider}</p>
                    </div>
                </div>
                <div class="results-content">
                    ${isProxy ? `
                        <p>Your email <strong>${email}</strong> uses <strong>${provider.companyProvider}</strong> - an email alias/proxy service that protects your privacy.</p>
                        <div class="proxy-notice">
                            <div class="proxy-icon">🛡️</div>
                            <div class="proxy-text">
                                <strong>Privacy Protection Detected:</strong> This service forwards emails to your real inbox while keeping your actual email address private.
                            </div>
                        </div>
                    ` : `
                        <p>Your email <strong>${email}</strong> is hosted with <strong>${provider.companyProvider}</strong>.</p>
                    `}
                    
                    <div class="detection-details">
                        <h4>Detection Details:</h4>
                        <div class="detection-summary">
                            <div class="detail-row">
                                <span class="detail-label">Provider:</span>
                                <span class="detail-value">${provider.companyProvider}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Detection Method:</span>
                                <span class="detail-value">${currentDetectedProvider.detectionMethod || 'domain_match'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Login URL:</span>
                                <span class="detail-value">${currentDetectedProvider.loginUrl || 'Not available'}</span>
                            </div>
                            ${currentDetectedProvider._meta ? `
                                <div class="detail-row">
                                    <span class="detail-label">Detection Time:</span>
                                    <span class="detail-value">${currentDetectedProvider._meta.detectionTime}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="raw-response-toggle">
                            <button class="toggle-btn" onclick="toggleRawResponse(this)" aria-expanded="false" aria-controls="raw-response-content">
                                <span class="toggle-icon">▶</span> View Full API Response
                            </button>
                            <div class="raw-response hide" id="raw-response-content">
                                <pre>${resultData}</pre>
                            </div>
                        </div>
                    </div>
                </div>
                ${currentDetectedProvider.loginUrl ? `
                    <button class="inbox-button" onclick="openEmailInbox()">
                        Go to your ${provider.companyProvider} inbox →
                    </button>
                ` : `
                    <button class="inbox-button disabled" disabled style="opacity: 0.5; cursor: not-allowed; background: #9ca3af;">
                        No direct inbox link available
                    </button>
                `}
            </div>
        `;
    } else {
        // Handle unknown provider case
        const displayResult = currentDetectedProvider || {
            provider: null,
            email: email,
            loginUrl: null
        };
        
        const resultData = JSON.stringify(displayResult, null, 2);
        
        content = `
            <div class="results-card unknown">
                <div class="results-header">
                    <div class="results-icon">❓</div>
                    <div class="results-title">
                        <h3>Found Your Email Provider</h3>
                        <p>Email provider: Unknown</p>
                    </div>
                </div>
                <div class="results-content">
                    <p>Your email <strong>${email}</strong> is from an unknown provider, but we'll still send the verification email!</p>
                    
                    <div class="detection-details">
                        <h4>Library Response Data:</h4>
                        <pre>${resultData}</pre>
                    </div>
                </div>
                <button class="inbox-button disabled" disabled>
                    Please check your email application
                </button>
            </div>
        `;
    }
    
        providerDetection.innerHTML = content;
        
        // Restore opacity after content update
        providerDetection.style.opacity = '1';
        
        // No need to scroll since it's in the same place as the detection bar
    }, 150); // Small delay for smooth transition
}

// Open email inbox
function openEmailInbox() {
    if (currentDetectedProvider && currentDetectedProvider.loginUrl) {
        window.open(currentDetectedProvider.loginUrl, '_blank');
    }
}

// Clear form on page load
function clearFormOnLoad() {
    emailInput.value = '';
    clearProviderDetection();
    clearResults();
    enableSubmitButton();
    // Auto-focus the email field for immediate typing
    emailInput.focus();
}

// Event listeners
emailInput.addEventListener('input', handleEmailChange);
signupForm.addEventListener('submit', handleFormSubmit);

// Clear form when page loads
window.addEventListener('load', clearFormOnLoad);

// Also clear on DOMContentLoaded as backup
document.addEventListener('DOMContentLoaded', clearFormOnLoad);

// Toggle raw response display
function toggleRawResponse(button) {
    const rawResponse = button.parentElement.querySelector('.raw-response');
    const icon = button.querySelector('.toggle-icon');
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    
    if (!isExpanded) {
        rawResponse.classList.remove('hide');
        rawResponse.classList.add('show');
        icon.textContent = '▼';
        button.innerHTML = '<span class="toggle-icon">▼</span> Hide Full API Response';
        button.setAttribute('aria-expanded', 'true');
    } else {
        rawResponse.classList.remove('show');
        rawResponse.classList.add('hide');
        icon.textContent = '▶';
        button.innerHTML = '<span class="toggle-icon">▶</span> View Full API Response';
        button.setAttribute('aria-expanded', 'false');
    }
}

// Make functions globally available
window.openEmailInbox = openEmailInbox;
window.toggleRawResponse = toggleRawResponse;

// Demo: Add some example emails for testing
console.log('🚀 Email Provider Links Demo loaded with REAL library API!');
console.log('Backend server is using @mikkelscheike/email-provider-links');
console.log('Try these emails to see different providers:');
console.log('- john@gmail.com (Gmail)');
console.log('- jane@outlook.com (Microsoft Outlook)');
console.log('- user@yahoo.com (Yahoo Mail)');
console.log('- test@protonmail.com (ProtonMail)');
console.log('- business@yourcompany.com (Business domain - will detect via DNS)');
