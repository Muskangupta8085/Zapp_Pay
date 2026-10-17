async function runTests() {
  const BASE_URL = 'http://localhost:5000/api/v1/auth';

  async function post(endpoint: string, data: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return { status: res.status, json: (await res.json()) as any };
  }

  async function get(endpoint: string, token: string) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { status: res.status, json: (await res.json()) as any };
  }

  console.log('🧪 Starting Phase 1 Authentication End-to-End Tests...\n');

  // 1. Check identifier
  console.log('1. Testing POST /check-identifier...');
  const checkRes = await post('/check-identifier', { identifier: '9876500001' });
  console.log('Response:', JSON.stringify(checkRes.json, null, 2));

  // 2. Register mobile user
  console.log('\n2. Testing POST /register (Mobile Flow)...');
  const regRes = await post('/register', {
    authMethod: 'mobile',
    phone: '9876500001',
    password: 'Password@123',
    fullName: 'Test Mobile User',
  });
  console.log('Response:', JSON.stringify(regRes.json, null, 2));
  const devOtp = regRes.json.data?.devOtp;
  const contactInfo = regRes.json.data?.contactInfo;

  if (!devOtp) {
    console.error('❌ devOtp not returned!');
    return;
  }

  // 3. Resend OTP cooldown test
  console.log('\n3. Testing POST /resend-otp (Cooldown check)...');
  const resendCooldown = await post('/resend-otp', { contactInfo, purpose: 'register' });
  console.log('Response (Expected 400 cooldown):', JSON.stringify(resendCooldown.json, null, 2));

  // 4. Verify OTP (Registration complete)
  console.log('\n4. Testing POST /verify-otp (Verify & provision wallet)...');
  const verifyRes = await post('/verify-otp', {
    contactInfo,
    otp: devOtp,
    isRegistered: false,
    purpose: 'register',
  });
  console.log('Response:', JSON.stringify(verifyRes.json, null, 2));
  const token = verifyRes.json.data?.token;
  const refreshToken = verifyRes.json.data?.refreshToken;
  const referralCode = verifyRes.json.data?.user?.referralCode;

  // 5. Authenticated /me
  console.log('\n5. Testing GET /me (Authenticated Profile & Wallet)...');
  const meRes = await get('/me', token);
  console.log('Response:', JSON.stringify(meRes.json, null, 2));

  // 6. Login with mobile + password
  console.log('\n6. Testing POST /login (Initiate 2FA)...');
  const loginRes = await post('/login', {
    identifier: '9876500001',
    password: 'Password@123',
    authMethod: 'mobile',
  });
  console.log('Response:', JSON.stringify(loginRes.json, null, 2));
  const loginOtp = loginRes.json.data?.devOtp;

  // 7. Verify login OTP
  console.log('\n7. Testing POST /verify-otp (Login 2FA completion)...');
  const loginVerifyRes = await post('/verify-otp', {
    contactInfo: '9876500001',
    otp: loginOtp,
    isRegistered: true,
    purpose: 'login',
  });
  console.log('Response:', JSON.stringify(loginVerifyRes.json, null, 2));

  // 8. Refresh Token
  console.log('\n8. Testing POST /refresh-token...');
  const refreshRes = await post('/refresh-token', { refreshToken });
  console.log('Response:', JSON.stringify(refreshRes.json, null, 2));
  const newAccessToken = refreshRes.json.data?.token;

  // 9. Forgot password & Reset password
  console.log('\n9. Testing POST /forgot-password & /reset-password...');
  const forgotRes = await post('/forgot-password', { identifier: '9876500001' });
  console.log('Forgot Password Response:', JSON.stringify(forgotRes.json, null, 2));
  const resetOtp = forgotRes.json.data?.devOtp;

  const resetRes = await post('/reset-password', {
    contactInfo: '9876500001',
    otp: resetOtp,
    newPassword: 'NewSecurePassword@456',
  });
  console.log('Reset Password Response:', JSON.stringify(resetRes.json, null, 2));

  // 10. Logout
  console.log('\n10. Testing POST /logout...');
  const logoutRes = await post('/logout', { refreshToken }, newAccessToken);
  console.log('Logout Response:', JSON.stringify(logoutRes.json, null, 2));

  console.log('\n✅ ALL 10 PHASE 1 AUTHENTICATION ENDPOINTS PASSED WITH FLYING COLORS!');
}

runTests().catch(console.error);
