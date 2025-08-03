const { getOne, runQuery } = require('../shared/database');

const setupBioTensorWS = (wss) => {
  // Store active connections by patient room
  const patientRooms = new Map();

  wss.on('connection', (ws, req) => {
    console.log('New BioTensor WebSocket connection');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'subscribe-patient':
            handlePatientSubscription(ws, data.patientId, patientRooms);
            break;
            
          case 'unsubscribe-patient':
            handlePatientUnsubscription(ws, data.patientId, patientRooms);
            break;
            
          case 'vitals-update':
            await handleVitalsUpdate(wss, data, patientRooms);
            break;
            
          case 'alert':
            await handleAlert(wss, data);
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
      // Clean up patient room subscriptions
      for (const [patientId, clients] of patientRooms.entries()) {
        const index = clients.indexOf(ws);
        if (index > -1) {
          clients.splice(index, 1);
          if (clients.length === 0) {
            patientRooms.delete(patientId);
          }
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Simulate real-time vital updates
  setInterval(() => {
    simulateVitalUpdates(wss, patientRooms);
  }, 5000); // Every 5 seconds
};

function handlePatientSubscription(ws, patientId, patientRooms) {
  if (!patientRooms.has(patientId)) {
    patientRooms.set(patientId, []);
  }
  
  const clients = patientRooms.get(patientId);
  if (!clients.includes(ws)) {
    clients.push(ws);
  }
  
  ws.send(JSON.stringify({
    type: 'subscribed',
    patientId,
    message: `Subscribed to patient ${patientId} updates`
  }));
}

function handlePatientUnsubscription(ws, patientId, patientRooms) {
  if (patientRooms.has(patientId)) {
    const clients = patientRooms.get(patientId);
    const index = clients.indexOf(ws);
    if (index > -1) {
      clients.splice(index, 1);
      if (clients.length === 0) {
        patientRooms.delete(patientId);
      }
    }
  }
  
  ws.send(JSON.stringify({
    type: 'unsubscribed',
    patientId,
    message: `Unsubscribed from patient ${patientId} updates`
  }));
}

async function handleVitalsUpdate(wss, data, patientRooms) {
  const { patientId, vitals } = data;
  
  // Broadcast to all clients subscribed to this patient
  if (patientRooms.has(patientId)) {
    const clients = patientRooms.get(patientId);
    const update = {
      type: 'vitals-update',
      patientId,
      vitals,
      timestamp: new Date().toISOString()
    };
    
    clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(update));
      }
    });
  }
  
  // Check for critical values and send alerts
  if (vitals.heartRate > 120 || vitals.heartRate < 50) {
    await sendAlert(wss, {
      type: 'critical-vitals',
      patientId,
      message: `Critical heart rate: ${vitals.heartRate} bpm`,
      severity: 'high'
    });
  }
  
  if (vitals.oxygenSaturation < 90) {
    await sendAlert(wss, {
      type: 'critical-vitals',
      patientId,
      message: `Low oxygen saturation: ${vitals.oxygenSaturation}%`,
      severity: 'critical'
    });
  }
}

async function handleAlert(wss, data) {
  await sendAlert(wss, data);
}

async function sendAlert(wss, alertData) {
  const alert = {
    type: 'alert',
    ...alertData,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString()
  };
  
  // Broadcast alert to all connected clients
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(alert));
    }
  });
  
  // Store alert in database
  try {
    await runQuery(
      `INSERT INTO alerts (id, type, patient_id, message, severity, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [alert.id, alert.type || 'general', alert.patientId, alert.message, alert.severity, ]
    );
  } catch (error) {
    console.error('Failed to store alert:', error);
  }
}

function simulateVitalUpdates(wss, patientRooms) {
  // Simulate vital updates for active patient subscriptions
  for (const [patientId, clients] of patientRooms.entries()) {
    if (clients.length > 0 && Math.random() > 0.7) { // 30% chance of update
      const vitals = {
        heartRate: 60 + Math.floor(Math.random() * 40),
        bloodPressure: {
          systolic: 110 + Math.floor(Math.random() * 30),
          diastolic: 70 + Math.floor(Math.random() * 20)
        },
        temperature: 36.5 + (Math.random() * 1.5),
        oxygenSaturation: 95 + Math.floor(Math.random() * 5),
        respiratoryRate: 12 + Math.floor(Math.random() * 8)
      };
      
      const update = {
        type: 'vitals-update',
        patientId,
        vitals,
        timestamp: new Date().toISOString(),
        source: 'monitor'
      };
      
      clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify(update));
        }
      });
    }
  }
}

module.exports = { setupBioTensorWS };