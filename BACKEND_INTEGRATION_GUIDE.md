# ABP Photonics Backend Integration Guide

## 🚀 Overview

This guide explains how to integrate the ABP Photonics frontend with the comprehensive backend system that includes:
- Patent Search API
- BioTensor Dashboard with real-time monitoring
- Cybersecurity Command Center
- User Authentication System

## 📦 Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Initialize Database

```bash
npm run init-db
npm run generate-data  # Optional: Generate mock data
```

### 3. Start Backend Server

```bash
npm run dev  # Development mode with auto-reload
# or
npm start    # Production mode
```

The backend will run on `http://localhost:3001`

## 🔌 Frontend Integration

### 1. Include API Client

Add to your HTML pages:

```html
<!-- Add before closing </body> tag -->
<script src="js/api-client.js"></script>
```

### 2. Page-Specific Integration Scripts

#### Patent Search Page
```html
<!-- On patent-search.html -->
<script src="js/patent-search-integration.js"></script>
```

#### Cybersecurity Dashboard
```html
<!-- On cybersecurity-dashboard.html -->
<script src="js/cybersecurity-dashboard-integration.js"></script>
```

#### BioTensor Dashboards
```html
<!-- On biotensor dashboard pages -->
<script src="js/biotensor-dashboard-integration.js"></script>
```

## 🔐 Authentication

### Login Example

```javascript
// Login user
try {
    const result = await window.abpAPI.login('admin@abp.com', 'demo123');
    console.log('Logged in:', result.user);
    // Token is automatically stored
} catch (error) {
    console.error('Login failed:', error);
}
```

### Check Authentication Status

```javascript
if (window.abpAPI.token) {
    // User is logged in
    const profile = await window.abpAPI.getProfile();
} else {
    // User needs to login
    showLoginPrompt();
}
```

## 📡 Real-Time Features

### WebSocket Connection

```javascript
// Connect to WebSocket
window.abpAPI.connectWebSocket(
    (message) => {
        // Handle incoming messages
        console.log('Received:', message);
    },
    (error) => {
        // Handle errors
        console.error('WebSocket error:', error);
    }
);
```

### BioTensor Real-Time Monitoring

```javascript
// Subscribe to patient updates
window.abpAPI.subscribeToPatient('PAT000001');

// Send vital signs update
window.abpAPI.sendVitalsUpdate('PAT000001', {
    heartRate: 72,
    bloodPressure: { systolic: 120, diastolic: 80 },
    temperature: 36.6,
    oxygenSaturation: 98
});
```

### Cybersecurity Real-Time Alerts

```javascript
// Subscribe to threat detection
window.abpAPI.subscribeToThreats();

// Subscribe to system health updates
window.abpAPI.subscribeToSystemHealth();

// Report security incident
window.abpAPI.reportIncident(
    'Suspicious Login Activity',
    'Multiple failed login attempts detected',
    'high'
);
```

## 🎯 API Usage Examples

### Patent Search

```javascript
// Search patents
const results = await window.abpAPI.searchPatents({
    query: 'photonics',
    category: 'Photonics',
    status: 'granted',
    limit: 20,
    offset: 0
});

// Get patent details
const patent = await window.abpAPI.getPatent('US10000001B2');

// AI Analysis (requires authentication)
const analysis = await window.abpAPI.analyzePatent('US10000001B2', 'prior-art');
```

### BioTensor Operations

```javascript
// Get patients list
const patients = await window.abpAPI.getPatients({
    search: 'John',
    status: 'active',
    limit: 10
});

// Record patient vitals
await window.abpAPI.recordVitals('patient-id', {
    heartRate: 75,
    bloodPressure: { systolic: 118, diastolic: 78 },
    temperature: 36.8,
    oxygenSaturation: 97,
    respiratoryRate: 16
});

// AI Risk Assessment
const risk = await window.abpAPI.assessPatientRisk('patient-id');
```

### Cybersecurity Operations

```javascript
// Get security dashboard
const dashboard = await window.abpAPI.getSecurityDashboard();

// Create security alert
await window.abpAPI.createSecurityAlert({
    title: 'Unusual Network Activity',
    description: 'Spike in outbound traffic detected',
    severity: 'high',
    source: 'Network Monitor'
});

// Run vulnerability scan (admin only)
const scan = await window.abpAPI.runVulnerabilityScan(['all'], 'full');

// Update threat status
await window.abpAPI.updateThreatStatus('threat-id', 'mitigated', 'Patched vulnerability');
```

## 🎨 UI Integration Patterns

### Loading States

```javascript
function showLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
    }
}
```

### Error Handling

```javascript
try {
    const data = await window.abpAPI.someOperation();
    // Handle success
} catch (error) {
    showError(error.message);
}

function showError(message) {
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}
```

### Real-Time Updates

```javascript
// Handle WebSocket messages
function handleWebSocketMessage(message) {
    switch (message.type) {
        case 'vitals-update':
            updateVitalsDisplay(message.patientId, message.vitals);
            break;
        case 'threat-detected':
            showThreatAlert(message.threat);
            break;
        case 'alert':
            showNotification(message);
            break;
    }
}
```

## 🔧 Configuration

### API Base URL

To change the API endpoint (e.g., for production):

```javascript
// Create API client with custom URL
window.abpAPI = new ABPApiClient('https://api.abpphotonics.com/api');
```

### CORS Configuration

For development, the backend allows:
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `https://alovladi007.github.io`

Update `.env` file to add more origins:
```
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## 📱 Responsive Considerations

The integration scripts work with responsive designs:

```javascript
// Check if mobile
const isMobile = window.innerWidth < 768;

// Adjust pagination for mobile
const pageSize = isMobile ? 10 : 20;
```

## 🐛 Debugging

### Enable Debug Mode

```javascript
// Enable detailed logging
window.abpAPI.debug = true;
```

### Check WebSocket Status

```javascript
if (window.abpAPI.wsConnection) {
    console.log('WebSocket state:', window.abpAPI.wsConnection.readyState);
    // 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
}
```

### Monitor Network Requests

Use browser DevTools Network tab to monitor API calls.

## 🚨 Common Issues

### CORS Errors
- Ensure backend is running
- Check ALLOWED_ORIGINS in backend .env
- Use correct protocol (http/https)

### WebSocket Connection Failed
- Check if backend WebSocket server is running
- Ensure no firewall blocking WebSocket port
- Try reconnecting: `window.abpAPI.connectWebSocket()`

### Authentication Errors
- Token might be expired - try logging in again
- Check if user has required permissions
- Verify backend JWT_SECRET is configured

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify backend is running: `http://localhost:3001/api/health`
3. Review backend logs for detailed error messages
4. Ensure all dependencies are installed

## 🎉 Next Steps

1. Customize the integration scripts for your specific needs
2. Add more real-time features using WebSocket
3. Implement additional security measures
4. Set up production deployment
5. Configure SSL/TLS for secure connections

Remember to always handle errors gracefully and provide user-friendly feedback!