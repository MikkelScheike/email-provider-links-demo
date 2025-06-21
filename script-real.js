// Real implementation using the actual email-provider-links library
import { getEmailProvider } from '@mikkelscheike/email-provider-links';

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
    'default': '📧'
};

// Get provider logo
function getProviderLogo(provider) {
    if (!provider) return providerLogos.default;
    
    // Check for exact matches first
    if (providerLogos[provider.companyProvider]) {
        return providerLogos[provider.companyProvider];
    }
    
    // Check for partial matches
    for (const [key, emoji] of Object.entries(providerLogos)) {
        if (provider.companyProvider && provider.companyProvider.toLowerCase().includes(key.toLowerCase())) {
            return emoji;
        }
    }
    
    return providerLogos.default;
}

// Show provider detection UI
function showProviderDetection(type, provider = null, detectionMethod = null) {
    let content = '';
    
    switch (type) {
        case 'detecting':
            content = `
                <div class="provider-info detecting">
                    <div class="provider-logo">🔍</div>
                    <div class="provider-details">
                        <div class="provider-name">Detecting email provider...</div>
                        <div class="provider-subtitle">Checking DNS records</div>
                    </div>
                </div>
            `;
            break;
            
        case 'detected':
            const logo = getProviderLogo(provider);
            const isBusinessEmail = detectionMethod && detectionMethod !== 'domain_match';
            const cssClass = isBusinessEmail ? 'detected business' : 'detected';
            
            let subtitle = 'Consumer email provider';
            if (isBusinessEmail) {
                subtitle = 'Business email detected via ' + detectionMethod.replace('_', ' ');
            }
            
            let methodDisplay = '';
            if (detectionMethod && detectionMethod !== 'domain_match') {
                methodDisplay = `<div class="detection-method">${detectionMethod.replace('_', ' ')}</div>`;
            }
            
            content = `
                <div class="provider-info ${cssClass}">
                    <div class="provider-logo">${logo}</div>
                    <div class="provider-details">
                        <div class="provider-name">${provider.companyProvider}</div>
                        <div class="provider-subtitle">${subtitle}</div>
                    </div>
                    ${methodDisplay}
                </div>
            `;
            break;
            
        case 'not_found':
            content = `
                <div class="provider-info">
                    <div class="provider-logo">❓</div>
                    <div class="provider-details">
                        <div class="provider-name">Unknown provider</div>
                        <div class="provider-subtitle">We'll still send the email!</div>
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

// Clear results section
function clearResults() {
    resultsSection.innerHTML = '';
}

// Handle email input changes
async function handleEmailChange() {
    const email = emailInput.value.trim();
    
    // Clear previous timeout
    if (detectionTimeout) {
        clearTimeout(detectionTimeout);
    }
    
    // Clear detection and results if email is empty or invalid
    if (!email || !email.includes('@')) {
        clearProviderDetection();
        clearResults();
        return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        clearProviderDetection();
        return;
    }
    
    // Show detecting state for business domains (they need DNS lookup)
    const domain = email.split('@')[1].toLowerCase();
    const commonDomains = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'protonmail.com', 'proton.me', 'yahoo.com', 'aol.com'];
    
    if (!commonDomains.includes(domain)) {
        showProviderDetection('detecting');
    }
    
    // Debounce the detection
    detectionTimeout = setTimeout(async () => {
        try {
            console.log('Detecting provider for:', email);
            const result = await getEmailProvider(email, 3000); // 3 second timeout for demo
            console.log('Detection result:', result);
            
            if (result.provider) {
                currentDetectedProvider = result;
                showProviderDetection('detected', result.provider, result.detectionMethod);
            } else {
                currentDetectedProvider = null;
                showProviderDetection('not_found');
            }
        } catch (error) {
            console.error('Error detecting email provider:', error);
            currentDetectedProvider = null;
            showProviderDetection('not_found');
        }
    }, 500); // 500ms debounce
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const email = emailInput.value.trim();
    if (!email) return;
    
    // Show loading state
    signupBtn.classList.add('loading');
    
    // Simulate signup process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Hide loading state
    signupBtn.classList.remove('loading');
    
    // Show inline results
    showInlineResults(email);
}

// Show inline results
function showInlineResults(email) {
    let content = '';
    
    if (currentDetectedProvider && currentDetectedProvider.provider) {
        const provider = currentDetectedProvider.provider;
        const logo = getProviderLogo(provider);
        const isBusinessEmail = currentDetectedProvider.detectionMethod && 
                               currentDetectedProvider.detectionMethod !== 'domain_match';
        const cardClass = isBusinessEmail ? 'business' : '';
        
        // Format the full result object for display
        const resultData = JSON.stringify(currentDetectedProvider, null, 2);
        
        content = `
            <div class="results-card ${cardClass}">
                <div class="results-header">
                    <div class="results-icon">${logo}</div>
                    <div class="results-title">
                        <h3>Account Created Successfully!</h3>
                        <p>Email provider detected: ${provider.companyProvider}</p>
                    </div>
                </div>
                <div class="results-content">
                    <p>Your email <strong>${email}</strong> is hosted with <strong>${provider.companyProvider}</strong>.</p>
                    
                    <div class="detection-details">
                        <h4>Library Response Data:</h4>
                        <pre>${resultData}</pre>
                    </div>
                </div>
                ${currentDetectedProvider.loginUrl ? `
                    <button class="inbox-button" onclick="openEmailInbox()">
                        Go to your ${provider.companyProvider} inbox →
                    </button>
                ` : `
                    <button class="inbox-button disabled" disabled>
                        No direct inbox link available
                    </button>
                `}
            </div>
        `;
    } else {
        content = `
            <div class="results-card unknown">
                <div class="results-header">
                    <div class="results-icon">❓</div>
                    <div class="results-title">
                        <h3>Account Created Successfully!</h3>
                        <p>Email provider: Unknown</p>
                    </div>
                </div>
                <div class="results-content">
                    <p>Your email <strong>${email}</strong> is from an unknown provider, but we'll still send the verification email!</p>
                    
                    <div class="detection-details">
                        <h4>Library Response Data:</h4>
                        <pre>{
  "provider": null,
  "email": "${email}",
  "loginUrl": null
}</pre>
                    </div>
                </div>
                <button class="inbox-button disabled" disabled>
                    Please check your email application
                </button>
            </div>
        `;
    }
    
    resultsSection.innerHTML = content;
    
    // Scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Open email inbox (separate from modal version)
function openEmailInbox() {
    if (currentDetectedProvider && currentDetectedProvider.loginUrl) {
        window.open(currentDetectedProvider.loginUrl, '_blank');
    }
}

// Event listeners
emailInput.addEventListener('input', handleEmailChange);
signupForm.addEventListener('submit', handleFormSubmit);

// Make functions globally available
window.openEmailInbox = openEmailInbox;

// Demo: Add some example emails for testing
console.log('🚀 Email Provider Links Demo loaded with REAL library!');
console.log('Try these emails to see different providers:');
console.log('- john@gmail.com (Gmail)');
console.log('- jane@outlook.com (Microsoft Outlook)');
console.log('- user@yahoo.com (Yahoo Mail)');
console.log('- test@protonmail.com (ProtonMail)');
console.log('- business@yourcompany.com (Business domain - will detect via DNS)');
