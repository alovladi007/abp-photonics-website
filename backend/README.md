# ABP Photonics Unified Backend

A comprehensive backend system integrating Patent Search, BioTensor Dashboard, Cybersecurity Monitoring, and Authentication services.

## 🚀 Features

### 1. **Authentication System**
- JWT-based authentication
- User registration and login
- Role-based access control (Admin, User, Security)
- Profile management
- Password change functionality

### 2. **Patent Search API**
- Advanced patent search with filtering
- Patent details and citations
- AI-powered patent analysis (prior art, claims, market)
- Saved searches
- Patent statistics and categories

### 3. **BioTensor Dashboard Backend**
- Real-time patient monitoring via WebSocket
- Vital signs recording and tracking
- AI risk assessment
- Medical imaging analysis
- Appointment management
- Division-based data isolation

### 4. **Cybersecurity Monitoring**
- Real-time threat detection via WebSocket
- Security event logging
- Vulnerability scanning
- Compliance tracking
- AI-powered threat analysis
- System health monitoring

## 📋 Prerequisites

- Node.js v14+ 
- npm or yarn
- SQLite3

## 🛠️ Installation

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Initialize database:**
```bash
npm run init-db
```

4. **Generate mock data (optional):**
```bash
npm run generate-data
```

## 🚀 Running the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3001`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (authenticated)
- `PUT /api/auth/profile` - Update profile (authenticated)
- `POST /api/auth/change-password` - Change password (authenticated)

### Patent Search
- `GET /api/patent/search` - Search patents
- `GET /api/patent/:id` - Get patent details
- `GET /api/patent/meta/categories` - Get patent categories
- `GET /api/patent/meta/statistics` - Get patent statistics
- `POST /api/patent/analyze` - AI patent analysis (authenticated)
- `GET /api/patent/saved-searches` - Get saved searches (authenticated)
- `POST /api/patent/saved-searches` - Save a search (authenticated)

### BioTensor
- `GET /api/biotensor/patients` - Get patients (authenticated)
- `GET /api/biotensor/patients/:id` - Get patient details (authenticated)
- `POST /api/biotensor/patients/:id/vitals` - Record vitals (authenticated)
- `POST /api/biotensor/patients/:id/assess-risk` - AI risk assessment (authenticated)
- `GET /api/biotensor/dashboard/stats` - Dashboard statistics (authenticated)
- `POST /api/biotensor/appointments` - Create appointment (authenticated)
- `POST /api/biotensor/imaging/analyze` - Analyze medical image (authenticated)

### Cybersecurity
- `GET /api/cybersecurity/dashboard` - Security dashboard (authenticated)
- `GET /api/cybersecurity/threats` - Get threats (authenticated)
- `POST /api/cybersecurity/alerts` - Create alert (authenticated)
- `POST /api/cybersecurity/scan/vulnerabilities` - Run vulnerability scan (admin)
- `GET /api/cybersecurity/events` - Get security events (authenticated)
- `PUT /api/cybersecurity/threats/:id/status` - Update threat status (authenticated)
- `GET /api/cybersecurity/compliance` - Get compliance status (authenticated)
- `POST /api/cybersecurity/ai/analyze-threat` - AI threat analysis (authenticated)

## 🔌 WebSocket Events

### BioTensor WebSocket
Connect to: `ws://localhost:3001`

**Client → Server:**
- `subscribe-patient` - Subscribe to patient updates
- `unsubscribe-patient` - Unsubscribe from patient
- `vitals-update` - Send vital signs update
- `alert` - Send alert

**Server → Client:**
- `vitals-update` - Real-time vital signs
- `alert` - Critical alerts
- `subscribed/unsubscribed` - Subscription confirmations

### Cybersecurity WebSocket
Connect to: `ws://localhost:3001`

**Client → Server:**
- `subscribe-threats` - Subscribe to threat updates
- `subscribe-system-health` - Subscribe to system health
- `report-incident` - Report security incident

**Server → Client:**
- `threat-detected` - New threat detected
- `system-health-update` - System health metrics
- `security-event` - Security events
- `incident-report` - Incident notifications

## 🔐 Authentication

Include JWT token in headers:
```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## 👥 Demo Users

| Email | Password | Role | Division |
|-------|----------|------|----------|
| admin@abp.com | demo123 | admin | all |
| john@abp.com | demo123 | user | biotensor |
| jane@abp.com | demo123 | user | cybersecurity |
| bob@abp.com | demo123 | user | patents |

## 🏗️ Architecture

```
backend/
├── api/
│   ├── auth/           # Authentication endpoints
│   ├── patent/         # Patent search endpoints
│   ├── biotensor/      # BioTensor endpoints
│   └── cybersecurity/  # Security endpoints
├── websocket/
│   ├── biotensor.ws.js    # Patient monitoring
│   └── cybersecurity.ws.js # Threat monitoring
├── shared/
│   └── database.js     # Database utilities
├── scripts/
│   ├── init-database.js    # DB initialization
│   └── generate-mock-data.js # Mock data
├── data/               # SQLite database
└── server.js          # Main server file
```

## 🧪 Testing with cURL

**Register user:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@abp.com","password":"demo123"}'
```

**Search patents:**
```bash
curl http://localhost:3001/api/patent/search?query=photonics
```

## 🐛 Troubleshooting

1. **Database errors:** Delete `data/abp.db` and run `npm run init-db`
2. **Port already in use:** Change PORT in `.env`
3. **CORS issues:** Check ALLOWED_ORIGINS in `.env`

## 📝 License

© 2024 ABP Photonics. All rights reserved.