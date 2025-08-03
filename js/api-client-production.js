// ABP Photonics API Client - Production Version
class ABPApiClient {
    constructor(baseURL = null) {
        // Auto-detect environment
        const isLocalhost = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
        
        // Use local backend if running locally, otherwise use production URL
        this.baseURL = baseURL || (isLocalhost 
            ? 'http://localhost:3001/api'
            : 'https://your-backend-url.com/api'); // Replace with your deployed backend URL
        
        this.token = localStorage.getItem('abp_auth_token');
        this.wsConnection = null;
        
        console.log('API Client initialized with:', this.baseURL);
    }

    // ... rest of the API client code remains the same ...
}

// Create global instance
window.abpAPI = new ABPApiClient();