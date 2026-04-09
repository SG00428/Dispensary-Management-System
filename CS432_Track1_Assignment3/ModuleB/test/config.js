// ═══════════════════════════════════════════════════════════════════════════
// Module B — Shared Configuration
// ═══════════════════════════════════════════════════════════════════════════

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api';

// Credentials matching seed_data.sql users
const USERS = {
  superadmin: { userLoginID: 30, username: 'sd1@admin.college.edu', password: 'Super@1234' },
  admin:      { userLoginID: 82, username: 'EMP00006',              password: 'Admin@1234' },
  doctor:     { userLoginID: 57, username: 'DOC125',                password: 'Doctor@1234' },
  faculty:    { userLoginID: 5,  username: 'FAC001',                password: 'Faculty@1234' },
  nurse:      { userLoginID: 23, username: 'NUR001',                password: 'Nurse@1234' },
  pharmacist: { userLoginID: 24, username: 'PHR001',                password: 'Pharma@1234' },
  technician: { userLoginID: 26, username: 'TECH001',               password: 'Tech@1234' },
  student:    { userLoginID: 1,  username: 'CS2021001',             password: 'Student@1234' },
};

// ── HTTP helpers ──────────────────────────────────────────────────────────────
async function request(method, path, body = null, token = null) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const start = performance.now();
  const res   = await fetch(url, opts);
  const elapsed = performance.now() - start;

  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data, elapsed, ok: res.ok };
}

async function login(role) {
  const u = USERS[role];
  if (!u) throw new Error(`Unknown role: ${role}`);
  const res = await request('POST', '/auth/login', {
    username: u.username,
    password: u.password,
  });
  if (!res.ok) throw new Error(`Login failed for ${role}: ${JSON.stringify(res.data)}`);
  return res.data.token;
}

// ── Result collector ──────────────────────────────────────────────────────────
class TestResults {
  constructor(suiteName) {
    this.suite = suiteName;
    this.tests = [];
    this.startTime = Date.now();
  }

  add(name, passed, detail = '', elapsed = 0) {
    this.tests.push({ name, passed, detail, elapsed });
    const icon = passed ? '✅' : '❌';
    console.log(`  ${icon} ${name}${detail ? ' — ' + detail : ''} (${elapsed.toFixed(1)}ms)`);
  }

  summary() {
    const total  = this.tests.length;
    const passed = this.tests.filter(t => t.passed).length;
    const failed = total - passed;
    const dur    = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log(`\n━━━ ${this.suite}: ${passed}/${total} passed, ${failed} failed (${dur}s) ━━━\n`);
    return { suite: this.suite, total, passed, failed, duration: dur, tests: this.tests };
  }
}

module.exports = { BASE_URL, USERS, request, login, TestResults };
