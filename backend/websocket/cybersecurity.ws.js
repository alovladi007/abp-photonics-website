const { getOne, runQuery } = require('../shared/database');

const setupCybersecurityWS = (wss) => {
  // Store active threat monitoring sessions
  const monitoringSessions = new Map();

  wss.on('connection', (ws, req) => {
    console.log('New Cybersecurity WebSocket connection');
    
    // Generate session ID
    const sessionId = Math.random().toString(36).substr(2, 9);
    monitoringSessions.set(sessionId, ws);
    
    // Send welcome message with session ID
    ws.send(JSON.stringify({
      type: 'connected',
      sessionId,
      message: 'Connected to Security Monitoring System'
    }));
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'subscribe-threats':
            handleThreatSubscription(ws, sessionId);
            break;
            
          case 'subscribe-system-health':
            handleSystemHealthSubscription(ws, sessionId);
            break;
            
          case 'report-incident':
            await handleIncidentReport(wss, data);
            break;
            
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });

    ws.on('close', () => {
      monitoringSessions.delete(sessionId);
      console.log(`Security monitoring session ${sessionId} closed`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Simulate threat detection
  setInterval(() => {
    simulateThreatDetection(wss);
  }, 10000); // Every 10 seconds

  // Simulate system health updates
  setInterval(() => {
    simulateSystemHealthUpdate(wss);
  }, 5000); // Every 5 seconds

  // Simulate security events
  setInterval(() => {
    simulateSecurityEvent(wss);
  }, 15000); // Every 15 seconds
};

function handleThreatSubscription(ws, sessionId) {
  ws.send(JSON.stringify({
    type: 'subscribed',
    channel: 'threats',
    message: 'Subscribed to threat detection updates'
  }));
}

function handleSystemHealthSubscription(ws, sessionId) {
  ws.send(JSON.stringify({
    type: 'subscribed',
    channel: 'system-health',
    message: 'Subscribed to system health updates'
  }));
}

async function handleIncidentReport(wss, data) {
  const incident = {
    id: Math.random().toString(36).substr(2, 9),
    type: 'incident-report',
    title: data.title,
    description: data.description,
    severity: data.severity || 'medium',
    reportedBy: data.userId,
    timestamp: new Date().toISOString(),
    status: 'investigating'
  };
  
  // Broadcast incident to all connected clients
  broadcastToAll(wss, incident);
  
  // Store incident in database
  try {
    await runQuery(
      `INSERT INTO security_events 
       (id, event_type, description, severity, user_id, occurred_at)
       VALUES (?, 'incident_reported', ?, ?, ?, datetime('now'))`,
      [incident.id, incident.description, incident.severity, incident.reportedBy]
    );
  } catch (error) {
    console.error('Failed to store incident:', error);
  }
}

function simulateThreatDetection(wss) {
  if (Math.random() > 0.8) { // 20% chance of threat
    const threats = [
      {
        type: 'malware',
        name: 'Suspicious Process Detected',
        description: 'Unusual process behavior detected on server-03',
        severity: 'high',
        confidence: 0.87
      },
      {
        type: 'intrusion',
        name: 'Failed Login Attempts',
        description: 'Multiple failed login attempts from IP 192.168.1.100',
        severity: 'medium',
        confidence: 0.92
      },
      {
        type: 'data-exfiltration',
        name: 'Unusual Data Transfer',
        description: 'Large data transfer detected to unknown external IP',
        severity: 'critical',
        confidence: 0.78
      },
      {
        type: 'dos',
        name: 'DDoS Attack Detected',
        description: 'Abnormal traffic spike from multiple sources',
        severity: 'critical',
        confidence: 0.95
      }
    ];
    
    const threat = threats[Math.floor(Math.random() * threats.length)];
    threat.id = Math.random().toString(36).substr(2, 9);
    threat.timestamp = new Date().toISOString();
    threat.status = 'active';
    
    const message = {
      type: 'threat-detected',
      threat
    };
    
    broadcastToAll(wss, message);
  }
}

function simulateSystemHealthUpdate(wss) {
  const systems = ['firewall', 'ids', 'antivirus', 'vpn', 'encryption'];
  const system = systems[Math.floor(Math.random() * systems.length)];
  
  const health = {
    type: 'system-health-update',
    system,
    metrics: {
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 100),
      network: Math.floor(Math.random() * 1000), // Mbps
      uptime: Math.floor(Math.random() * 30 * 24 * 60 * 60), // seconds
      health: 85 + Math.floor(Math.random() * 15), // 85-100%
      status: Math.random() > 0.95 ? 'warning' : 'active'
    },
    timestamp: new Date().toISOString()
  };
  
  broadcastToAll(wss, health);
}

function simulateSecurityEvent(wss) {
  const events = [
    {
      type: 'configuration-change',
      description: 'Firewall rule updated: Port 8080 opened for maintenance',
      severity: 'low',
      user: 'admin@abp.com'
    },
    {
      type: 'patch-applied',
      description: 'Security patch KB5021233 applied to web-server-01',
      severity: 'info',
      user: 'system'
    },
    {
      type: 'backup-completed',
      description: 'Daily security configuration backup completed',
      severity: 'info',
      user: 'system'
    },
    {
      type: 'scan-completed',
      description: 'Weekly vulnerability scan completed - 3 issues found',
      severity: 'medium',
      user: 'security-scanner'
    },
    {
      type: 'certificate-expiry',
      description: 'SSL certificate for api.abp.com expires in 30 days',
      severity: 'medium',
      user: 'cert-monitor'
    }
  ];
  
  if (Math.random() > 0.7) { // 30% chance of event
    const event = events[Math.floor(Math.random() * events.length)];
    event.id = Math.random().toString(36).substr(2, 9);
    event.timestamp = new Date().toISOString();
    
    const message = {
      type: 'security-event',
      event
    };
    
    broadcastToAll(wss, message);
  }
}

function broadcastToAll(wss, message) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(message));
    }
  });
}

module.exports = { setupCybersecurityWS };