import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.1'],
  },
};

const BASE_URL = 'http://localhost:8000';

export default function () {
  // Test login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'admin@demo.local',
    password: 'Demo123!',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => JSON.parse(r.body).access_token !== undefined,
  });

  errorRate.add(loginRes.status !== 200);

  if (loginRes.status === 200) {
    const token = JSON.parse(loginRes.body).access_token;

    // Test authenticated endpoint
    const studiesRes = http.get(`${BASE_URL}/api/studies`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    check(studiesRes, {
      'studies fetched': (r) => r.status === 200,
    });

    errorRate.add(studiesRes.status !== 200);
  }

  sleep(1);
}