// ABP Photonics API Client
class ABPApiClient {
    constructor(baseURL = 'http://localhost:3001/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('abp_auth_token');
        this.wsConnection = null;
    }

    // Set auth token
    setToken(token) {
        this.token = token;
        localStorage.setItem('abp_auth_token', token);
    }

    // Clear auth token
    clearToken() {
        this.token = null;
        localStorage.removeItem('abp_auth_token');
    }

    // Base request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            }
        };

        // Add auth token if available
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async register(email, password, name, division) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name, division })
        });
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async getProfile() {
        return this.request('/auth/profile');
    }

    async updateProfile(updates) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async changePassword(currentPassword, newPassword) {
        return this.request('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }

    async logout() {
        await this.request('/auth/logout', { method: 'POST' });
        this.clearToken();
    }

    // Patent endpoints
    async searchPatents(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/patent/search?${queryString}`);
    }

    async getPatent(id) {
        return this.request(`/patent/${id}`);
    }

    async getPatentCategories() {
        return this.request('/patent/meta/categories');
    }

    async getPatentStatistics() {
        return this.request('/patent/meta/statistics');
    }

    async analyzePatent(patentId, analysisType) {
        return this.request('/patent/analyze', {
            method: 'POST',
            body: JSON.stringify({ patentId, analysisType })
        });
    }

    async getSavedSearches() {
        return this.request('/patent/saved-searches');
    }

    async saveSearch(name, query, filters) {
        return this.request('/patent/saved-searches', {
            method: 'POST',
            body: JSON.stringify({ name, query, filters })
        });
    }

    // BioTensor endpoints
    async getPatients(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/biotensor/patients?${queryString}`);
    }

    async getPatientDetails(id) {
        return this.request(`/biotensor/patients/${id}`);
    }

    async recordVitals(patientId, vitals) {
        return this.request(`/biotensor/patients/${patientId}/vitals`, {
            method: 'POST',
            body: JSON.stringify(vitals)
        });
    }

    async assessPatientRisk(patientId) {
        return this.request(`/biotensor/patients/${patientId}/assess-risk`, {
            method: 'POST'
        });
    }

    async getBioTensorStats() {
        return this.request('/biotensor/dashboard/stats');
    }

    async createAppointment(appointmentData) {
        return this.request('/biotensor/appointments', {
            method: 'POST',
            body: JSON.stringify(appointmentData)
        });
    }

    async analyzeImage(imageType, patientId, imageData) {
        return this.request('/biotensor/imaging/analyze', {
            method: 'POST',
            body: JSON.stringify({ imageType, patientId, imageData })
        });
    }

    // Cybersecurity endpoints
    async getSecurityDashboard() {
        return this.request('/cybersecurity/dashboard');
    }

    async getThreats(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/cybersecurity/threats?${queryString}`);
    }

    async createSecurityAlert(alertData) {
        return this.request('/cybersecurity/alerts', {
            method: 'POST',
            body: JSON.stringify(alertData)
        });
    }

    async runVulnerabilityScan(targetSystems, scanType) {
        return this.request('/cybersecurity/scan/vulnerabilities', {
            method: 'POST',
            body: JSON.stringify({ targetSystems, scanType })
        });
    }

    async getSecurityEvents(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/cybersecurity/events?${queryString}`);
    }

    async updateThreatStatus(threatId, status, resolution) {
        return this.request(`/cybersecurity/threats/${threatId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, resolution })
        });
    }

    async getCompliance() {
        return this.request('/cybersecurity/compliance');
    }

    async analyzeThreat(threatId, analysisType) {
        return this.request('/cybersecurity/ai/analyze-threat', {
            method: 'POST',
            body: JSON.stringify({ threatId, analysisType })
        });
    }

    // WebSocket connections
    connectWebSocket(onMessage, onError) {
        const wsURL = this.baseURL.replace('http', 'ws').replace('/api', '');
        this.wsConnection = new WebSocket(wsURL);

        this.wsConnection.onopen = () => {
            console.log('WebSocket connected');
        };

        this.wsConnection.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (onMessage) onMessage(data);
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };

        this.wsConnection.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (onError) onError(error);
        };

        this.wsConnection.onclose = () => {
            console.log('WebSocket disconnected');
        };

        return this.wsConnection;
    }

    // BioTensor WebSocket methods
    subscribeToPatient(patientId) {
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
            this.wsConnection.send(JSON.stringify({
                type: 'subscribe-patient',
                patientId
            }));
        }
    }

    unsubscribeFromPatient(patientId) {
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
            this.wsConnection.send(JSON.stringify({
                type: 'unsubscribe-patient',
                patientId
            }));
        }
    }

    sendVitalsUpdate(patientId, vitals) {
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
            this.wsConnection.send(JSON.stringify({
                type: 'vitals-update',
                patientId,
                vitals
            }));
        }
    }

    // Cybersecurity WebSocket methods
    subscribeToThreats() {
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
            this.wsConnection.send(JSON.stringify({
                type: 'subscribe-threats'
            }));
        }
    }

    subscribeToSystemHealth() {
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
            this.wsConnection.send(JSON.stringify({
                type: 'subscribe-system-health'
            }));
        }
    }

    reportIncident(title, description, severity) {
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
            this.wsConnection.send(JSON.stringify({
                type: 'report-incident',
                title,
                description,
                severity,
                userId: 'current-user' // Should be from auth context
            }));
        }
    }

    disconnectWebSocket() {
        if (this.wsConnection) {
            this.wsConnection.close();
            this.wsConnection = null;
        }
    }
}

// Create global instance
window.abpAPI = new ABPApiClient();