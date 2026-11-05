import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';
import nodemailer, { Transporter } from 'nodemailer';

// Ensure server/.env is loaded regardless of process working directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface EmailSendResult {
  sent: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private isMockTransporter: boolean = false;
  private readonly defaultFromAddress: string;

  constructor() {
    this.defaultFromAddress = process.env.EMAIL_FROM || 'SaveBite Support <no-reply@savebite.in>';
    this.initFromEnv();
  }

  /**
   * Initializes real SMTP transporter from environment variables.
   * Defaults to Gmail SMTP (smtp.gmail.com:465 with secure TLS).
   * Supports Gmail App Passwords (with or without spaces).
   */
  public initFromEnv(): void {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const user = process.env.SMTP_USER?.trim();
    const rawPass = process.env.SMTP_PASS?.trim();
    // Normalize Gmail App Passwords by removing internal whitespace
    const pass = (user && host.includes('gmail') && rawPass)
      ? rawPass.replace(/\s+/g, '')
      : rawPass;
    const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;

    if (host && user && pass && host !== 'smtp.example.com' && !pass.includes('placeholder')) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
      console.log(`[EmailService] Configured SMTP transporter initialized with host: ${host}:${port} (secure TLS: ${secure})`);
    } else {
      this.transporter = null;
    }
  }

  /**
   * Returns whether SMTP email sending is actively configured.
   */
  public isEmailConfigured(): boolean {
    if (this.transporter) {
      return true;
    }
    this.initFromEnv();
    return this.transporter !== null;
  }

  /**
   * Returns the active transporter or initializes one from env.
   * No fallback to mock/test inboxes (e.g. Ethereal) is performed.
   */
  public async ensureTransporter(): Promise<Transporter | null> {
    if (!this.transporter) {
      this.initFromEnv();
    }
    return this.transporter;
  }

  /**
   * Override transporter (used for test suite mocking)
   */
  public setTransporter(transporter: Transporter | null): void {
    this.transporter = transporter;
    this.isMockTransporter = transporter !== null;
  }

  /**
   * Verifies the SMTP connection and authentication with the remote mail server.
   */
  public async verifyConnection(): Promise<{ ok: boolean; message: string; error?: string }> {
    const transporter = await this.ensureTransporter();
    if (!transporter) {
      return {
        ok: false,
        message: 'SMTP credentials are not configured in server/.env',
        error: 'MISSING_CREDENTIALS',
      };
    }

    try {
      await transporter.verify();
      console.log('[EmailService] SMTP connection verified successfully.');
      return {
        ok: true,
        message: 'SMTP connection verified successfully.',
      };
    } catch (err: any) {
      // Safe diagnostic logging without exposing credentials
      console.error('[EmailService] SMTP connection verification failed:', err.message || err);
      return {
        ok: false,
        message: 'SMTP connection verification failed.',
        error: err.message,
      };
    }
  }

  /**
   * Pre-flight recipient validation: checks email syntax and recipient domain MX records.
   * Prevents attempting delivery to unconfigured or parked domains (e.g. Hostinger dns-parking.com),
   * which would otherwise cause SMTP delivery bounces ("remote server is misconfigured").
   */
  public async validateRecipientEmail(
    email: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const parts = cleanEmail.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return { valid: false, reason: 'Invalid email address format.' };
    }

    const domain = parts[1];

    // In unit testing environment or when mock transporter is set, bypass live external DNS queries
    if (process.env.NODE_ENV === 'test' || this.isMockTransporter) {
      return { valid: true };
    }

    try {
      // 1. Resolve MX records for recipient domain
      const mxRecords = await dns.promises.resolveMx(domain).catch(() => []);
      if (!mxRecords || mxRecords.length === 0) {
        return {
          valid: false,
          reason: `The domain "${domain}" has no MX records (mail servers) configured to receive incoming emails.`,
        };
      }

      // 2. Check for parked domain status (e.g., Hostinger DNS parking)
      // When a domain points to dns-parking nameservers without active email hosting,
      // remote servers reject delivery with "remote server is misconfigured" (550).
      try {
        const nsRecords = await dns.promises.resolveNs(domain).catch(() => []);
        const isParked = nsRecords.some((ns) => ns.toLowerCase().includes('dns-parking.com'));
        if (isParked) {
          return {
            valid: false,
            reason: `The domain "${domain}" is currently parked on Hostinger nameservers without an active incoming mailbox. Verification emails cannot be delivered. Please use a valid, active email address (such as your personal Gmail or Outlook inbox).`,
          };
        }
      } catch {
        // NS check failure is non-fatal if MX exists
      }

      return { valid: true };
    } catch (err: any) {
      console.warn(`[EmailService] DNS MX resolution warning for ${domain}:`, err.message || err);
      return { valid: true };
    }
  }

  /**
   * Send password reset email with secure time-limited token directly to customer's inbox.
   */
  public async sendPasswordResetEmail(
    recipientEmail: string,
    recipientName: string,
    otp: string
  ): Promise<EmailSendResult> {
    const cleanEmail = recipientEmail.trim().toLowerCase();

    // Pre-flight recipient domain check to prevent delivery bounces
    const domainCheck = await this.validateRecipientEmail(cleanEmail);
    if (!domainCheck.valid) {
      console.warn(`[EmailService] Pre-flight recipient check failed for ${cleanEmail}: ${domainCheck.reason}`);
      return {
        sent: false,
        error: domainCheck.reason || `Recipient address cannot receive emails on domain ${cleanEmail.split('@')[1]}.`,
      };
    }

    const textContent = `Hello ${recipientName || 'SaveBite user'},\n\nYour SaveBite password reset code is ${otp}. It expires in 5 minutes and can be used once. If you did not request this code, you can ignore this email.`;

    const htmlContent = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1e293b"><h1 style="color:#006030">SaveBite password reset</h1><p>Hello ${recipientName || 'SaveBite user'},</p><p>Use this verification code to reset your password:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#006030">${otp}</p><p>This code expires in 5 minutes and can be used once. If you did not request it, ignore this email.</p></div>`;

    const transporter = await this.ensureTransporter();

    if (!transporter) {
      console.error('[EmailService] Email delivery failed: SMTP is not configured in server/.env.');
      return {
        sent: false,
        error: 'SMTP is not configured: set valid SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, and SMTP_PASS in server/.env.',
      };
    }

    try {
      const user = process.env.SMTP_USER?.trim();
      const host = process.env.SMTP_HOST || '';
      let fromAddress = process.env.EMAIL_FROM?.trim();
      // When relaying via Gmail SMTP, ensure sender uses authenticated user address to pass SPF/DKIM
      if (host.includes('gmail') && user) {
        fromAddress = `SaveBite Support <${user}>`;
      } else if (!fromAddress || fromAddress.includes('@example.com')) {
        fromAddress = user ? `SaveBite Support <${user}>` : this.defaultFromAddress;
      }

      const info = await transporter.sendMail({
        from: fromAddress,
        to: cleanEmail,
        subject: 'Your SaveBite password reset code',
        text: textContent,
        html: htmlContent,
      });

      console.log(`[EmailService] Password reset email accepted by SMTP server. MessageId: ${info.messageId}`);

      return {
        sent: true,
        messageId: info.messageId,
      };
    } catch (err: any) {
      // Safe diagnostic logging without exposing credentials
      console.error('[EmailService] SMTP delivery failed:', err.message || 'Unknown SMTP error');
      return {
        sent: false,
        error: err.message || 'SMTP delivery failed',
      };
    }
  }

  /**
   * Send 6-digit email verification OTP directly to partner's inbox for email update.
   */
  public async sendEmailVerificationOtp(
    recipientEmail: string,
    recipientName: string,
    otp: string
  ): Promise<EmailSendResult> {
    const cleanEmail = recipientEmail.trim().toLowerCase();

    // Pre-flight recipient domain check to prevent delivery bounces
    const domainCheck = await this.validateRecipientEmail(cleanEmail);
    if (!domainCheck.valid) {
      console.warn(`[EmailService] Pre-flight recipient check failed for ${cleanEmail}: ${domainCheck.reason}`);
      return {
        sent: false,
        error: domainCheck.reason || `Recipient address cannot receive emails on domain ${cleanEmail.split('@')[1]}.`,
      };
    }

    const textContent = `Hello ${recipientName || 'Partner'},\n\nYour 6-digit SaveBite email verification code is: ${otp}\n\nThis verification code expires in 10 minutes. If you did not request this email change, please ignore this message.\n\nSaveBite Team`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; color: #1e293b;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
          <h2 style="color: #006030; margin: 0; font-size: 22px; font-weight: 800;">SaveBite Partner Portal</h2>
        </div>
        <p style="font-size: 15px; color: #334155; margin: 0 0 16px;">Hello ${recipientName || 'Partner'},</p>
        <p style="font-size: 15px; color: #334155; margin: 0 0 20px;">Use the following 6-digit one-time password (OTP) to verify ownership and update your registered account email:</p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px; text-align: center; margin: 0 0 24px;">
          <span style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #006030; font-family: monospace;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #64748b; margin: 0 0 8px;">⏳ This verification code expires in <strong>10 minutes</strong> and can only be used once.</p>
        <p style="font-size: 13px; color: #94a3b8; margin: 0;">If you did not initiate this change on your SaveBite Partner account, you can safely disregard this email.</p>
      </div>
    `;

    const transporter = await this.ensureTransporter();

    if (!transporter) {
      console.warn('[EmailService] SMTP not configured. OTP for verification:', otp);
      return {
        sent: false,
        error: 'SMTP is not configured in server/.env.',
      };
    }

    try {
      const user = process.env.SMTP_USER?.trim();
      const host = process.env.SMTP_HOST || '';
      let fromAddress = process.env.EMAIL_FROM?.trim();
      // When relaying via Gmail SMTP, ensure sender uses authenticated user address to pass SPF/DKIM
      if (host.includes('gmail') && user) {
        fromAddress = `SaveBite Partner Support <${user}>`;
      } else if (!fromAddress || fromAddress.includes('@example.com')) {
        fromAddress = user ? `SaveBite Partner Support <${user}>` : this.defaultFromAddress;
      }

      const info = await transporter.sendMail({
        from: fromAddress,
        to: cleanEmail,
        subject: `SaveBite Partner - Verify Your New Email Address (${otp})`,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[EmailService] Email verification OTP accepted by SMTP. MessageId: ${info.messageId}`);
      return {
        sent: true,
        messageId: info.messageId,
      };
    } catch (err: any) {
      console.error('[EmailService] SMTP verification email delivery failed:', err.message || err);
      return {
        sent: false,
        error: err.message || 'SMTP delivery failed',
      };
    }
  }
}

export const emailService = new EmailService();
export default emailService;
