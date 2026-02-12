# Email Provider Links Demo

![npm](https://img.shields.io/npm/v/@mikkelscheike/email-provider-links)

A beautiful, interactive demo showcasing the power of the `@mikkelscheike/email-provider-links` library. This demo features a modern signup form with real-time email provider detection and direct inbox linking.

## 🚀 Features

- **Real-time Email Provider Detection**: As users type their email, the system instantly detects their provider
- **93+ Supported Providers**: Gmail, Outlook, Yahoo, ProtonMail, business domains, and many more
- **Direct Inbox Links**: After signup, users get a direct link to their email provider
- **Business Domain Detection**: Automatically detects Google Workspace, Microsoft 365, and other business email services via DNS
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Mobile Friendly**: Fully responsive design that works on all devices

## 📧 Try These Examples

- **Consumer emails**: 
  - `john@gmail.com` (Gmail)
  - `jane@outlook.com` (Microsoft Outlook)
  - `user@yahoo.com` (Yahoo Mail)
  - `test@protonmail.com` (ProtonMail)
  
- **Business emails**: 
  - `business@yourcompany.com` (Will attempt DNS detection)
  - Any custom domain with Google Workspace or Microsoft 365

## 🛠️ Running the Demo

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   ```
   http://localhost:3000
   ```

### Deploy to Render.com

This demo is configured for easy deployment to Render.com:

1. **Fork this repository** to your GitHub account

2. **Connect to Render.com**:
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure the service**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
   - **Health Check Path**: `/api/health`

4. **Deploy**: Click "Create Web Service"

The `render.yaml` file in this repository contains all the necessary configuration for automatic deployment.

### GitHub Actions Integration

This repository includes GitHub Actions workflows to show Render deployment status in your GitHub repository:

1. **Get your Render API Key**:
   - Go to [Render Account Settings](https://dashboard.render.com/u/settings?add-api-key)
   - Click "Create API Key" and copy the key

2. **Add GitHub Secrets**:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add a new secret named `RENDER_API_KEY` with your Render API key
   - (Optional) Add `RENDER_SERVICE_ID` if you want to specify the service ID directly
   - (Optional) Add `RENDER_SERVICE_NAME` if your Render service has a different name than `email-provider-links-demo`

3. **Choose a workflow**:
   - **Full workflow** (`.github/workflows/render-status.yml`): Monitors deployments and waits for completion, creates GitHub deployment statuses
   - **Simple workflow** (`.github/workflows/render-status-simple.yml`): Quick status checks without waiting

The workflows will automatically:
- ✅ Show deployment status as GitHub commit status checks
- ✅ Create GitHub deployment records with environment URLs
- ✅ Display deployment status in pull requests and commits
- ✅ Provide deployment summaries in workflow runs

## 🔍 What's Happening Behind the Scenes?

### Real-time Detection
As you type an email address, the demo:
1. Validates the email format
2. Checks if it's a known consumer provider (instant response)
3. For unknown domains, performs DNS lookups to detect business email services
4. Shows visual feedback with provider logos and detection methods

### Smart UX
- **Debounced input**: Waits 500ms after typing stops before detecting
- **Loading states**: Shows "detecting" animation for DNS lookups
- **Visual feedback**: Different colors and badges for different provider types
- **Direct linking**: After signup, provides a direct button to open the user's email provider

## 💻 Technology Stack

- **Pure JavaScript**: No frameworks, just vanilla JS with ES6 modules
- **Modern CSS**: CSS Grid, Flexbox, animations, and gradients
- **Email Provider Links Library**: The star of the show!

## 🎯 Perfect for Demonstrating

- **Product demos**: Show how your signup flow can be improved
- **Sales presentations**: Visual proof of concept for the library
- **Developer onboarding**: Interactive way to understand the library's capabilities
- **User experience testing**: See how users react to instant provider detection

## 📦 Library Integration

The demo showcases the main library function:

```javascript
import { getEmailProvider } from '@mikkelscheike/email-provider-links';

const result = await getEmailProvider('user@example.com');
// Returns: { provider, loginUrl, detectionMethod, ... }
```

## 🔗 Links

- [Email Provider Links Library](https://github.com/mikkelscheike/email-provider-links)
- [NPM Package](https://www.npmjs.com/package/@mikkelscheike/email-provider-links)

---

Built with ❤️ to showcase the power of smart email provider detection!
