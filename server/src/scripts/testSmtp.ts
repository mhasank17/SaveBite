import dotenv from 'dotenv';
import path from 'path';
import tls from 'tls';
import crypto from 'crypto';

// Ensure server/.env is loaded
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import emailService from '../services/emailService';

async function testTlsSocket(host: string, port: number): Promise<{ ok: boolean; greeting?: string; error?: string }> {
  return new Promise((resolve) => {
    const socket = tls.connect(port, host, { servername: host }, () => {
      socket.once('data', (data) => {
        const greeting = data.toString().trim();
        socket.end();
        resolve({ ok: true, greeting });
      });
    });

    socket.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });

    socket.setTimeout(8000, () => {
      socket.destroy();
      resolve({ ok: false, error: 'Connection timed out after 8000ms' });
    });
  });
}

async function main() {
  console.log('\n======================================================');
  console.log('   SaveBite SMTP Diagnostics & Connection Tester');
  console.log('======================================================\n');

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
  const user = process.env.SMTP_USER?.trim() || '';
  const rawPass = process.env.SMTP_PASS?.trim() || '';
  const from = process.env.EMAIL_FROM || (user ? `SaveBite Support <${user}>` : 'SaveBite Support <no-reply@savebite.in>');

  // Mask user for safe logging
  const maskedUser = user
    ? user.replace(/^(.{2})(.*)(@.*)$/, (_, start, mid, end) => `${start}${'*'.repeat(mid.length)}${end}`)
    : '(empty / not configured)';

  // Mask pass - NEVER print credentials
  const hasPass = Boolean(rawPass && !rawPass.includes('placeholder'));
  const passLength = hasPass ? rawPass.replace(/\s+/g, '').length : 0;
  const maskedPass = hasPass ? `[CONFIGURED: ${passLength} characters, credentials masked]` : '(empty / not configured)';

  console.log('1. Current Configuration in server/.env:');
  console.log(`   SMTP Host:       ${host}`);
  console.log(`   SMTP Port:       ${port}`);
  console.log(`   Secure (TLS):    ${secure}`);
  console.log(`   SMTP User:       ${maskedUser}`);
  console.log(`   SMTP Password:   ${maskedPass}`);
  console.log(`   From Address:    ${from}`);
  console.log('   Recovery Method: Six-digit email OTP\n');

  console.log('2. Testing Network Connectivity to Gmail SMTP:');
  console.log(`   Connecting to ${host}:${port} via secure TLS...`);
  const tlsCheck = await testTlsSocket(host, port);
  if (tlsCheck.ok) {
    console.log(`   [OK] Successfully connected to ${host}:${port} over TLS.`);
    console.log(`   [OK] Server response: ${tlsCheck.greeting}\n`);
  } else {
    console.error(`   [FAILED] Could not connect to ${host}:${port}: ${tlsCheck.error}`);
    console.error('   Please check your internet connection or firewall rules.\n');
  }

  if (!emailService.isEmailConfigured()) {
    console.log('3. Authentication Status:');
    console.log('   ------------------------------------------------------');
    console.log('   [MISSING CONFIGURATION] SMTP_USER and SMTP_PASS are empty in server/.env.');
    console.log('   Real delivery requires valid provider credentials; no email was sent.');
    console.log('   ------------------------------------------------------');
    console.log('\nTo configure Gmail SMTP delivery:\n');
    console.log('1. Go to your Google Account Security settings:');
    console.log('   https://myaccount.google.com/security');
    console.log('2. Ensure "2-Step Verification" is turned ON.');
    console.log('3. Open "App passwords":');
    console.log('   https://myaccount.google.com/apppasswords');
    console.log('4. Create a new App Password (name it "SaveBite").');
    console.log('5. Google generates a 16-character code (e.g. "abcd efgh ijkl mnop").');
    console.log('6. Open server/.env and fill in:');
    console.log('   SMTP_USER="your-email@gmail.com"');
    console.log('   SMTP_PASS="abcd efgh ijkl mnop"');
    console.log('   EMAIL_FROM="SaveBite Support <your-email@gmail.com>"');
    console.log('\n7. Test connection and send a real test email:');
    console.log('   npm run test:smtp -- your-email@gmail.com\n');
    process.exit(0);
  }

  console.log('3. Testing SMTP Authentication & Handshake with Nodemailer...');
  const verifyResult = await emailService.verifyConnection();

  if (!verifyResult.ok) {
    console.error(`\n[FAILED] SMTP authentication failed: ${verifyResult.error || verifyResult.message}`);
    console.error('\nTroubleshooting:');
    console.error('1. Did you use a 16-character Google App Password (not your personal Gmail password)?');
    console.error('2. Is 2-Step Verification active on the Google account?');
    console.error('3. Make sure the email in SMTP_USER matches the Google account that generated the App Password.\n');
    process.exit(1);
  }

  console.log('[OK] SMTP TLS connection and App Password authentication verified successfully!');

  // Check if a test recipient is specified via CLI args, or fallback to the authenticated sender email
  const recipientArg = process.argv.slice(2).find((arg) => arg.includes('@'));
  const recipient = recipientArg || user;

  if (recipient) {
    console.log('\n4. Sending a live test password reset email...');
    const sendResult = await emailService.sendPasswordResetEmail(recipient, 'SaveBite Tester', crypto.randomInt(0, 1_000_000).toString().padStart(6, '0'));

    if (sendResult.sent) {
      console.log('\n[SUCCESS] Email was accepted by the SMTP server!');
      console.log(`  Message ID:     ${sendResult.messageId}`);
      console.log('  Recipient accepted by SMTP.');
      console.log('\n[VERIFIED] The email was accepted by Google SMTP for delivery.');
      console.log('Please check the recipient inbox (and Spam/Promotions folder) to confirm receipt.\n');
    } else {
      console.error(`\n[FAILED] SMTP server rejected the email: ${sendResult.error}`);
      process.exit(1);
    }
  } else {
    console.log('\nTo dispatch a live test email to your inbox:');
    console.log('  npm run test:smtp -- your-email@gmail.com\n');
  }
}

main().catch((err) => {
  console.error('\n[FATAL ERROR]', err.message || err);
  process.exit(1);
});
