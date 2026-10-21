import http from 'http';
import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import { ENV } from '../config/env.js';
import { User } from '../models/user.model.js';
import { Wallet } from '../models/wallet.model.js';
import { Transaction } from '../models/transaction.model.js';
import { AuthService } from '../services/auth.service.js';
import { ProcessedWebhook } from '../models/processedWebhook.model.js';
import { IdempotencyKey } from '../models/idempotencyKey.model.js';
import { LedgerEntry } from '../models/ledger.model.js';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function recordTest(suite: string, name: string, passed: boolean, details: string) {
  results.push({ suite, name, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${icon}] ${suite}: ${name}`);
  if (details) {
    console.log(`       ↳ ${details}`);
  }
}

async function runSecurityTestSuite() {
  console.log('===============================================================');
  console.log('🔒 ZAPP PAY — MANDATORY SECURITY REMEDIATION TEST SUITE');
  console.log('===============================================================\n');

  await connectDB();

  // Start HTTP server on dynamic port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
  console.log(`Ephemeral Test Server listening at: ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------
    // SETUP FIXTURES
    // -------------------------------------------------------------
    const testPrefix = `sec_test_${Date.now()}`;
    const pinHash = await bcrypt.hash('123456', 10);

    // Create User A
    const userA = await User.create({
      fullName: 'Security Test User A',
      email: `${testPrefix}_a@test.com`,
      phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: await bcrypt.hash('Pass@123456', 10),
      transactionPinHash: pinHash,
      role: 'user',
      isPhoneVerified: true,
      isEmailVerified: true,
      tokenVersion: 0,
      referralCode: `REFA${Math.floor(1000 + Math.random() * 9000)}`,
    });

    const walletA = await Wallet.create({
      userId: userA._id,
      walletAddress: `0x_sec_user_a_${Date.now()}`,
      balances: [
        { symbol: 'INR', amount: 100 }, // Exactly ₹100 for concurrency race test
        { symbol: 'xCoin', amount: 10 },
      ],
    });

    // Create User B
    const userB = await User.create({
      fullName: 'Security Test User B',
      email: `${testPrefix}_b@test.com`,
      phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: await bcrypt.hash('Pass@123456', 10),
      transactionPinHash: pinHash,
      role: 'user',
      isPhoneVerified: true,
      isEmailVerified: true,
      tokenVersion: 0,
      referralCode: `REFB${Math.floor(1000 + Math.random() * 9000)}`,
    });

    const walletB = await Wallet.create({
      userId: userB._id,
      walletAddress: `0x_sec_user_b_${Date.now()}`,
      balances: [
        { symbol: 'INR', amount: 0 },
        { symbol: 'xCoin', amount: 0 },
      ],
    });

    // Generate valid JWT tokens
    const tokenA = AuthService.generateAccessToken(userA as any);
    const tokenB = AuthService.generateAccessToken(userB as any);

    // =============================================================
    // TEST 1: Concurrency Controls & Race Conditions (Double Spending)
    // =============================================================
    console.log('--- TEST 1: Concurrency & Double-Spending Prevention ---');
    // User A has exactly ₹100.
    // We launch 10 simultaneous debit requests of ₹100 each to User B.
    // Only 1 MUST succeed. 9 MUST fail with 400 Insufficient Funds.
    // Final balance must be exactly 0, never negative.
    const concurrentTransfers = Array.from({ length: 10 }).map((_, i) =>
      fetch(`${baseUrl}/wallet/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
          'Idempotency-Key': `race-debit-${testPrefix}-${i}`,
        },
        body: JSON.stringify({
          receiverAddress: walletB.walletAddress,
          symbol: 'INR',
          amount: 100,
          pin: '123456',
        }),
      }).then(async (res) => ({ status: res.status, body: await res.json() }))
    );

    const raceResults = await Promise.all(concurrentTransfers);
    const successCount = raceResults.filter((r) => r.status === 200 || r.status === 201).length;
    const failCount = raceResults.filter((r) => r.status === 400).length;

    // Check resulting balance directly from database
    const finalWalletA = await Wallet.findOne({ userId: userA._id });
    const inrBalance = finalWalletA?.balances.find((b) => b.symbol === 'INR')?.amount;

    const concurrencyPassed = successCount === 1 && failCount === 9 && inrBalance === 0;
    recordTest(
      'Concurrency Control',
      '10 Simultaneous ₹100 Debits with ₹100 Initial Balance',
      concurrencyPassed,
      `Successes: ${successCount} (expected 1), Failures: ${failCount} (expected 9), Final Balance: ₹${inrBalance} (expected ₹0.00)`
    );

    // =============================================================
    // TEST 2: Idempotency Enforcement & Tamper Detection
    // =============================================================
    console.log('\n--- TEST 2: Idempotency Enforcement & Payload Tampering ---');
    // Top up wallet A with ₹500 for idempotency tests
    await Wallet.updateOne(
      { userId: userA._id, 'balances.symbol': 'INR' },
      { $set: { 'balances.$.amount': 500 } }
    );

    const idempotencyKey = `idem-key-${Date.now()}`;
    const initialPayload = {
      receiverAddress: walletB.walletAddress,
      symbol: 'INR',
      amount: 50,
      pin: '123456',
    };

    // 1st request: clean execution
    const idemRes1 = await fetch(`${baseUrl}/wallet/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(initialPayload),
    });
    const idemJson1 = (await idemRes1.json()) as any;

    // 2nd request: identical payload with same key -> should return cached response without double debit
    await new Promise((r) => setTimeout(r, 50));
    const idemRes2 = await fetch(`${baseUrl}/wallet/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(initialPayload),
    });
    const idemJson2 = (await idemRes2.json()) as any;
    const isCachedReplay =
      (idemRes2.status === 200 || idemRes2.status === 201) &&
      (idemRes2.headers.get('x-cache') === 'HIT' || idemRes2.headers.get('x-cache-lookup') === 'IDEMPOTENT_HIT');

    // 3rd request: altered payload with SAME key -> MUST return 409 Conflict
    const alteredPayload = {
      receiverAddress: walletB.walletAddress,
      symbol: 'INR',
      amount: 150, // Tampered amount
      pin: '123456',
    };
    const idemRes3 = await fetch(`${baseUrl}/wallet/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(alteredPayload),
    });
    const isConflictReturned = idemRes3.status === 409;

    recordTest(
      'Idempotency Replay',
      'Identical Request Replay returns cached result with X-Cache: HIT',
      isCachedReplay,
      `Status: ${idemRes2.status}, X-Cache Header: ${idemRes2.headers.get('x-cache')}`
    );

    recordTest(
      'Idempotency Conflict',
      'Altered Payload Replay returns 409 Conflict',
      isConflictReturned,
      `Status: ${idemRes3.status} (expected 409)`
    );

    // =============================================================
    // TEST 3: Scope Boundary & Horizontal Privilege Escalation
    // =============================================================
    console.log('\n--- TEST 3: Scope Boundary & Horizontal Privilege Escalation ---');
    // User A attempts to access admin endpoints without admin role
    const adminBreachRes = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: {
        Authorization: `Bearer ${tokenA}`, // Regular user role
      },
    });
    const isAdminBlocked = adminBreachRes.status === 403;

    // User A attempts to mutate admin config / pricing
    const configBreachRes = await fetch(`${baseUrl}/admin/xcoin-config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ currentPriceINR: 9999 }),
    });
    const isConfigBlocked = configBreachRes.status === 403;

    recordTest(
      'Scope Boundary',
      'Regular User JWT blocked from accessing Admin Audit Logs',
      isAdminBlocked,
      `Status: ${adminBreachRes.status} (expected 403)`
    );

    recordTest(
      'Scope Boundary',
      'Regular User JWT blocked from modifying Token Pricing Engine',
      isConfigBlocked,
      `Status: ${configBreachRes.status} (expected 403)`
    );

    // =============================================================
    // TEST 4: PIN Brute Force & Rate Limit Lockout
    // =============================================================
    console.log('\n--- TEST 4: PIN Brute Force & 15-Minute Lockout ---');
    // Submit 3 invalid PIN attempts for User B
    const badPinAttempts = [];
    for (let i = 1; i <= 3; i++) {
      const res = await fetch(`${baseUrl}/user/pin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ pin: '999999' }),
      });
      badPinAttempts.push({ attempt: i, status: res.status, json: (await res.json()) as any });
    }

    // 4th attempt: should be blocked by 15-minute lock even if pin is now correct
    const lockedRes = await fetch(`${baseUrl}/user/pin/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ pin: '123456' }), // Real pin
    });
    const lockedJson = (await lockedRes.json()) as any;
    const isLockEnforced = lockedRes.status === 429 && lockedJson.locked === true;

    recordTest(
      'PIN Security',
      '3 Failed PIN attempts trigger account lock and 4th attempt returns 429',
      isLockEnforced,
      `3rd Attempt Status: ${badPinAttempts[2].status}, 4th Attempt Status: ${lockedRes.status}, locked: ${lockedJson.locked}`
    );

    // =============================================================
    // TEST 5: Webhook Replay Attacks & Cryptographic Signature
    // =============================================================
    console.log('\n--- TEST 5: Webhook Cryptographic Verification & Replay Protection ---');
    const secret = ENV.WEBHOOK_SECRET || 'dev_webhook_signing_secret_key_32bytes';
    const webhookEventId = `pay_evt_${Date.now()}`;
    const webhookPayload = {
      eventId: webhookEventId,
      eventType: 'payment.captured',
      provider: 'razorpay',
      data: {
        referenceId: webhookEventId,
        userId: userB._id.toString(),
        amount: 250,
        currency: 'INR',
        paymentMethod: 'UPI',
      },
    };
    const rawPayload = JSON.stringify(webhookPayload);
    const validSignature = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');
    const invalidSignature = 'invalid_tampered_signature_0123456789abcdef';

    // 1. Invalid signature should be rejected with 401/403
    const badSigRes = await fetch(`${baseUrl}/webhooks/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': invalidSignature,
      },
      body: rawPayload,
    });
    const isBadSigRejected = badSigRes.status === 403;

    // 2. Valid signature should be accepted with 200 and credit User B's balance
    const goodSigRes = await fetch(`${baseUrl}/webhooks/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': validSignature,
      },
      body: rawPayload,
    });
    const isGoodSigAccepted = goodSigRes.status === 200;

    // Check balance after 1st credit
    const walletBAfterDeposit1 = await Wallet.findOne({ userId: userB._id });
    const balanceAfterDep1 = walletBAfterDeposit1?.balances.find((b) => b.symbol === 'INR')?.amount;

    // 3. Replay attack: resend identical webhook with same eventId
    const replayRes = await fetch(`${baseUrl}/webhooks/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': validSignature,
      },
      body: rawPayload,
    });
    const replayJson = (await replayRes.json()) as any;
    const isReplayIgnoredGracefully = replayRes.status === 200 && replayJson.message.includes('ignored');

    // Verify balance was NOT credited twice
    const walletBAfterReplay = await Wallet.findOne({ userId: userB._id });
    const balanceAfterReplay = walletBAfterReplay?.balances.find((b) => b.symbol === 'INR')?.amount;
    const noDoubleCredit = balanceAfterDep1 === balanceAfterReplay && (balanceAfterDep1 || 0) > 0;

    recordTest(
      'Webhook Security',
      'Tampered Cryptographic Signature rejected with 403',
      isBadSigRejected,
      `Status: ${badSigRes.status} (expected 403)`
    );

    recordTest(
      'Webhook Security',
      'Legitimate Signed Webhook accepted and balance settled',
      isGoodSigAccepted,
      `Status: ${goodSigRes.status}, Balance: ₹${balanceAfterDep1}`
    );

    recordTest(
      'Webhook Replay',
      'Duplicate Webhook ignored without duplicate wallet balance crediting',
      isReplayIgnoredGracefully && noDoubleCredit,
      `Replay Status: ${replayRes.status}, Balance After Replay: ₹${balanceAfterReplay} (no duplicate credit)`
    );

    // =============================================================
    // TEST 6: Finite State Machine (FSM) Enforcement
    // =============================================================
    console.log('\n--- TEST 6: Finite State Machine (FSM) Enforcement ---');
    // Create a transaction in 'completed' state
    const terminalTx = await Transaction.create({
      referenceId: `REF_${Date.now()}`,
      senderAddress: walletA.walletAddress,
      receiverAddress: walletB.walletAddress,
      senderId: userA._id,
      receiverId: userB._id,
      symbol: 'INR',
      amount: 10,
      fee: 0,
      type: 'transfer',
      status: 'completed',
      txHash: `0x_terminal_hash_${Date.now()}`,
    });

    // Attempt to illegally transition 'completed' -> 'pending' via schema validation
    const loadedTx = await Transaction.findById(terminalTx._id);
    let schemaFsmBlocked = false;
    if (loadedTx) {
      loadedTx.status = 'pending' as any;
      try {
        await loadedTx.save();
      } catch (err: any) {
        if (err.message && err.message.includes('Invalid state transition')) {
          schemaFsmBlocked = true;
        }
      }
    }

    recordTest(
      'FSM Terminal State',
      'Terminal state "completed" cannot transition back to "pending"',
      schemaFsmBlocked,
      schemaFsmBlocked ? 'Terminal state transition safely rejected by schema FSM' : 'Failed to reject terminal transition'
    );

    // -------------------------------------------------------------
    // CLEANUP TEST FIXTURES
    // -------------------------------------------------------------
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    await Wallet.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await Transaction.deleteMany({ _id: terminalTx._id });
    await ProcessedWebhook.deleteMany({ eventId: webhookEventId });
    await IdempotencyKey.deleteMany({ userId: userA._id });
    await LedgerEntry.deleteMany({
      account: { $in: [walletA.walletAddress, walletB.walletAddress] },
    });
  } catch (error) {
    console.error('Fatal error during test suite execution:', error);
  } finally {
    server.close();
  }

  // =============================================================
  // FINAL SCORECARD
  // =============================================================
  console.log('\n===============================================================');
  console.log('📊 FINAL SECURITY SCORECARD');
  console.log('===============================================================');
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;

  console.log(`Total Security Vectors Tested: ${total}`);
  console.log(`Passed:                        ${passedCount}`);
  console.log(`Failed:                        ${failedCount}`);

  if (failedCount === 0) {
    console.log('\n🎉 ALL SECURITY CONTROLS VERIFIED & PASSING WITH ZERO DEFECTS!');
    process.exit(0);
  } else {
    console.error(`\n🚨 ${failedCount} SECURITY CHECKS FAILED! PRODUCTION DEPLOYMENT BLOCKED.`);
    process.exit(1);
  }
}

runSecurityTestSuite();
