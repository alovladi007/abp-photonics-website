// Cybersecurity Dashboard Integration with Backend API
document.addEventListener('DOMContentLoaded', function() {
    // Check if API client is available
    if (!window.abpAPI) {
        console.error('API client not loaded');
        return;
    }

    // Dashboard state
    let threats = [];
    let systemHealth = {};
    let activeAlerts = [];

    // DOM elements
    const threatCountEl = document.getElementById('threat-count');
    const criticalThreatsEl = document.getElementById('critical-threats');
    const activeThreatsEl = document.getElementById('active-threats');
    const systemHealthContainer = document.getElementById('system-health');
    const threatListContainer = document.getElementById('threat-list');
    const eventLogContainer = document.getElementById('event-log');
    const alertsContainer = document.getElementById('alerts-container');

    // Initialize dashboard
    initializeDashboard();

    async function initializeDashboard() {
        // Check authentication
        if (!window.abpAPI.token) {
            showLoginPrompt();
            return;
        }

        // Load initial data
        await loadDashboardData();

        // Connect WebSocket for real-time updates
        connectWebSocket();

        // Set up refresh intervals
        setInterval(loadDashboardData, 60000); // Refresh every minute
    }

    // Load dashboard data
    async function loadDashboardData() {
        try {
            const data = await window.abpAPI.getSecurityDashboard();
            
            // Update threat statistics
            updateThreatStats(data.threatStats);
            
            // Update system health
            updateSystemHealth(data.systemHealth);
            
            // Update recent events
            updateEventLog(data.recentEvents);
            
            // Update vulnerabilities
            updateVulnerabilities(data.vulnerabilities);
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            showError('Failed to load security dashboard data');
        }
    }

    // Connect WebSocket for real-time updates
    function connectWebSocket() {
        window.abpAPI.connectWebSocket((message) => {
            handleWebSocketMessage(message);
        }, (error) => {
            console.error('WebSocket error:', error);
        });

        // Subscribe to channels
        window.abpAPI.subscribeToThreats();
        window.abpAPI.subscribeToSystemHealth();
    }

    // Handle WebSocket messages
    function handleWebSocketMessage(message) {
        switch (message.type) {
            case 'threat-detected':
                handleNewThreat(message.threat);
                break;
            case 'system-health-update':
                handleSystemHealthUpdate(message);
                break;
            case 'security-event':
                handleSecurityEvent(message.event);
                break;
            case 'security-alert':
                handleSecurityAlert(message);
                break;
        }
    }

    // Handle new threat detection
    function handleNewThreat(threat) {
        // Add to threats list
        threats.unshift(threat);
        
        // Show notification
        showNotification(`New ${threat.severity} threat detected: ${threat.name}`, threat.severity);
        
        // Update UI
        addThreatToList(threat);
        updateThreatCount();
        
        // Play alert sound for critical threats
        if (threat.severity === 'critical') {
            playAlertSound();
        }
    }

    // Update threat statistics
    function updateThreatStats(stats) {
        if (threatCountEl) threatCountEl.textContent = stats.total_threats || 0;
        if (criticalThreatsEl) criticalThreatsEl.textContent = stats.critical_threats || 0;
        if (activeThreatsEl) activeThreatsEl.textContent = stats.active_threats || 0;

        // Update threat chart
        updateThreatChart(stats);
    }

    // Update system health display
    function updateSystemHealth(health) {
        if (!systemHealthContainer) return;

        systemHealthContainer.innerHTML = Object.entries(health).map(([system, data]) => `
            <div class="bg-slate-800/50 p-4 rounded-lg border ${data.status === 'active' ? 'border-green-600/30' : 'border-yellow-600/30'}">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="text-sm font-semibold text-white capitalize">${system.replace('_', ' ')}</h4>
                    <span class="px-2 py-1 text-xs rounded ${data.status === 'active' ? 'bg-green-600/20 text-green-300' : 'bg-yellow-600/20 text-yellow-300'}">
                        ${data.status}
                    </span>
                </div>
                <div class="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-r ${data.health > 90 ? 'from-green-500 to-green-600' : data.health > 70 ? 'from-yellow-500 to-yellow-600' : 'from-red-500 to-red-600'}" 
                         style="width: ${data.health}%"></div>
                </div>
                <p class="text-xs text-gray-400 mt-1">Health: ${data.health}%</p>
            </div>
        `).join('');
    }

    // Handle system health updates
    function handleSystemHealthUpdate(update) {
        systemHealth[update.system] = update.metrics;
        
        // Update specific system health display
        updateSystemHealthMetric(update.system, update.metrics);
    }

    // Update event log
    function updateEventLog(events) {
        if (!eventLogContainer) return;

        eventLogContainer.innerHTML = events.map(event => `
            <div class="flex items-start gap-3 p-3 hover:bg-slate-800/30 rounded transition-colors">
                <span class="text-2xl">${getEventIcon(event.event_type)}</span>
                <div class="flex-1">
                    <p class="text-sm text-white">${event.description}</p>
                    <p class="text-xs text-gray-400">${formatTime(event.occurred_at)}</p>
                </div>
                <span class="px-2 py-1 text-xs rounded ${getSeverityColor(event.severity)}">
                    ${event.severity}
                </span>
            </div>
        `).join('');
    }

    // Add threat to list
    function addThreatToList(threat) {
        if (!threatListContainer) return;

        const threatEl = document.createElement('div');
        threatEl.className = 'bg-slate-800/50 p-4 rounded-lg border border-red-600/30 mb-4 animate-pulse-red';
        threatEl.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h4 class="text-lg font-semibold text-white">${threat.name}</h4>
                <span class="px-3 py-1 text-xs rounded ${getSeverityColor(threat.severity)}">
                    ${threat.severity}
                </span>
            </div>
            <p class="text-sm text-gray-300 mb-3">${threat.description}</p>
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-400">Detected: ${formatTime(threat.timestamp)}</span>
                <button onclick="mitigateThreat('${threat.id}')" class="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors">
                    Mitigate
                </button>
            </div>
        `;

        threatListContainer.insertBefore(threatEl, threatListContainer.firstChild);
    }

    // Mitigate threat
    window.mitigateThreat = async function(threatId) {
        try {
            await window.abpAPI.updateThreatStatus(threatId, 'mitigated', 'Manually mitigated by user');
            showNotification('Threat mitigation initiated', 'success');
            
            // Update UI
            const threatEl = document.querySelector(`[data-threat-id="${threatId}"]`);
            if (threatEl) {
                threatEl.classList.add('opacity-50');
            }
        } catch (error) {
            console.error('Failed to mitigate threat:', error);
            showNotification('Failed to mitigate threat', 'error');
        }
    };

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 animate-slide-in ${
            type === 'critical' ? 'bg-red-600' :
            type === 'error' ? 'bg-red-500' :
            type === 'success' ? 'bg-green-600' :
            'bg-blue-600'
        } text-white`;
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-2xl">${
                    type === 'critical' ? '🚨' :
                    type === 'error' ? '❌' :
                    type === 'success' ? '✅' :
                    'ℹ️'
                }</span>
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white/80 hover:text-white">
                    ✕
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Update threat chart
    function updateThreatChart(stats) {
        const chartContainer = document.getElementById('threat-chart');
        if (!chartContainer) return;

        // Simple bar chart visualization
        const total = stats.total_threats || 1;
        chartContainer.innerHTML = `
            <div class="space-y-2">
                <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-400 w-20">Critical</span>
                    <div class="flex-1 h-6 bg-slate-700 rounded overflow-hidden">
                        <div class="h-full bg-red-600" style="width: ${(stats.critical_threats / total * 100)}%"></div>
                    </div>
                    <span class="text-xs text-white">${stats.critical_threats}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-400 w-20">High</span>
                    <div class="flex-1 h-6 bg-slate-700 rounded overflow-hidden">
                        <div class="h-full bg-orange-600" style="width: ${(stats.high_threats / total * 100)}%"></div>
                    </div>
                    <span class="text-xs text-white">${stats.high_threats}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-400 w-20">Medium</span>
                    <div class="flex-1 h-6 bg-slate-700 rounded overflow-hidden">
                        <div class="h-full bg-yellow-600" style="width: ${(stats.medium_threats / total * 100)}%"></div>
                    </div>
                    <span class="text-xs text-white">${stats.medium_threats}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-400 w-20">Low</span>
                    <div class="flex-1 h-6 bg-slate-700 rounded overflow-hidden">
                        <div class="h-full bg-blue-600" style="width: ${(stats.low_threats / total * 100)}%"></div>
                    </div>
                    <span class="text-xs text-white">${stats.low_threats}</span>
                </div>
            </div>
        `;
    }

    // Helper functions
    function getSeverityColor(severity) {
        const colors = {
            'critical': 'bg-red-600/20 text-red-300',
            'high': 'bg-orange-600/20 text-orange-300',
            'medium': 'bg-yellow-600/20 text-yellow-300',
            'low': 'bg-blue-600/20 text-blue-300',
            'info': 'bg-gray-600/20 text-gray-300'
        };
        return colors[severity] || colors.info;
    }

    function getEventIcon(eventType) {
        const icons = {
            'threat_detected': '🚨',
            'alert_created': '⚠️',
            'configuration_change': '⚙️',
            'patch_applied': '🔧',
            'backup_completed': '💾',
            'scan_completed': '🔍',
            'certificate_expiry': '📜'
        };
        return icons[eventType] || '📋';
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        
        return date.toLocaleString();
    }

    function playAlertSound() {
        // Create and play alert sound
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrT