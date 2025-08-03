require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db, runQuery } = require('../shared/database');

const generateMockData = async () => {
  console.log('Generating mock data...');

  try {
    // Create demo users
    const users = [
      { email: 'admin@abp.com', name: 'Admin User', role: 'admin', division: 'all' },
      { email: 'john@abp.com', name: 'John Doe', role: 'user', division: 'biotensor' },
      { email: 'jane@abp.com', name: 'Jane Smith', role: 'user', division: 'cybersecurity' },
      { email: 'bob@abp.com', name: 'Bob Johnson', role: 'user', division: 'patents' }
    ];

    const hashedPassword = await bcrypt.hash('demo123', 10);

    for (const user of users) {
      const userId = uuidv4();
      await runQuery(
        `INSERT OR IGNORE INTO users (id, email, password, name, role, division, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [userId, user.email, hashedPassword, user.name, user.role, user.division]
      );
    }

    // Create mock patents
    const patentCategories = ['Photonics', 'Quantum Computing', 'Biomedical', 'Cybersecurity', 'AI/ML'];
    const patentStatuses = ['granted', 'pending', 'filed'];

    for (let i = 1; i <= 50; i++) {
      const patentId = `US${10000000 + i}B2`;
      const category = patentCategories[Math.floor(Math.random() * patentCategories.length)];
      const status = patentStatuses[Math.floor(Math.random() * patentStatuses.length)];
      
      await runQuery(
        `INSERT OR IGNORE INTO patents (id, title, abstract, claims, filing_date, grant_date, status, category) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patentId,
          `${category} Innovation Patent ${i}`,
          `This patent describes an innovative method for ${category.toLowerCase()} applications...`,
          `Claim 1: A method for...\nClaim 2: The method of claim 1...\nClaim 3: A system comprising...`,
          new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString(),
          status === 'granted' ? new Date(2023 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString() : null,
          status,
          category
        ]
      );

      // Create inventors
      const inventorId = uuidv4();
      await runQuery(
        `INSERT OR IGNORE INTO inventors (id, name, email, organization) 
         VALUES (?, ?, ?, ?)`,
        [inventorId, `Inventor ${i}`, `inventor${i}@abp.com`, 'ABP Photonics']
      );

      // Link patent to inventor
      await runQuery(
        `INSERT OR IGNORE INTO patent_inventors (patent_id, inventor_id) 
         VALUES (?, ?)`,
        [patentId, inventorId]
      );
    }

    // Create mock patients
    const divisions = ['mynx-natalcare', 'olosa-vision', 'cerebro-logic', 'praedica'];
    const statuses = ['active', 'active', 'active', 'critical'];

    for (let i = 1; i <= 100; i++) {
      const patientId = `PAT${String(i).padStart(6, '0')}`;
      const division = divisions[Math.floor(Math.random() * divisions.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      await runQuery(
        `INSERT OR IGNORE INTO patients (id, patient_id, name, date_of_birth, gender, division, status, medical_record_number) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          patientId,
          `Patient ${i}`,
          new Date(1950 + Math.floor(Math.random() * 70), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString(),
          Math.random() > 0.5 ? 'M' : 'F',
          division,
          status,
          `MRN${String(i).padStart(8, '0')}`
        ]
      );
    }

    // Create mock security threats
    const threatTypes = ['malware', 'phishing', 'intrusion', 'data-breach', 'dos'];
    const severities = ['critical', 'high', 'medium', 'low'];

    for (let i = 1; i <= 30; i++) {
      const threatId = uuidv4();
      const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const status = Math.random() > 0.3 ? 'mitigated' : 'active';
      
      await runQuery(
        `INSERT OR IGNORE INTO security_threats (id, title, description, severity, threat_type, source, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          threatId,
          `${threatType.charAt(0).toUpperCase() + threatType.slice(1)} Threat ${i}`,
          `Detected ${threatType} activity from suspicious source...`,
          severity,
          threatType,
          `Source ${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          status
        ]
      );
    }

    console.log('✅ Mock data generated successfully');
  } catch (error) {
    console.error('❌ Mock data generation failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
};

generateMockData();