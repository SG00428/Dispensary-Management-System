// ═══════════════════════════════════════════════════════════════════════════
// Module B — Step 0: Set Passwords for All Test Users
// Run once before running any other test script.
// ═══════════════════════════════════════════════════════════════════════════

const { BASE_URL, USERS, request, login } = require('./config');

async function setupPasswords() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Module B — Setting Passwords for All Test Users           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  for (const [role, u] of Object.entries(USERS)) {
    const res = await request('POST', '/auth/set-password', {
      userLoginID: u.userLoginID,
      newPassword: u.password,
    });
    const icon = res.ok ? '✅' : '⚠️';
    console.log(`  ${icon} ${role.padEnd(14)} (ID ${String(u.userLoginID).padEnd(4)}) → ${res.ok ? 'password set' : res.data?.message || res.data?.error || 'already set'}`);
  }

  // Verify logins work
  console.log('\nVerifying logins...');
  for (const [role] of Object.entries(USERS)) {
    try {
      const token = await login(role);
      console.log(`  ✅ ${role.padEnd(14)} → login OK (token: ${token.substring(0, 20)}...)`);
    } catch (err) {
      console.log(`  ❌ ${role.padEnd(14)} → ${err.message}`);
    }
  }

  console.log('\n✅ Setup complete. You can now run the test scripts.\n');
}

setupPasswords().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
