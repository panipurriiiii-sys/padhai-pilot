import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

function cfg() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
  };
}

/** Returns true when every required SMTP env var is set. */
export function isMailConfigured(): boolean {
  const { host, user, pass } = cfg();
  return !!(host && user && pass);
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transport: Transporter | null = null;

  private getTransport(): Transporter | null {
    if (this.transport) return this.transport;
    if (!isMailConfigured()) return null;
    const { host, port, user, pass } = cfg();
    this.transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
    return this.transport;
  }

  async sendPasswordReset(to: string, token: string, appName = 'PadhaiPilot'): Promise<boolean> {
    const transport = this.getTransport();
    if (!transport) {
      this.logger.warn('SMTP not configured — password reset email not sent');
      return false;
    }
    const { from } = cfg();
    const resetUrl = `${process.env.NEXT_PUBLIC_TEACHER_URL || 'https://padhai-pilot-grwp.vercel.app'}?tab=settings&reset_token=${token}`;
    try {
      await transport.sendMail({
        from: `"${appName}" <${from}>`,
        to,
        subject: `Password reset for ${appName}`,
        text: [
          `You requested a password reset for your ${appName} account.`,
          '',
          `Reset token: ${token}`,
          '',
          `Or use this link: ${resetUrl}`,
          '',
          'This link expires in 1 hour. If you did not request a reset, you can ignore this email.',
        ].join('\n'),
        html: `
          <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="font-family:'Playfair Display',serif;color:#1C1917">Password Reset</h2>
            <p style="color:#44403C">You requested a password reset for your <strong>${appName}</strong> account.</p>
            <div style="background:#F5F4F1;border-radius:8px;padding:16px 20px;margin:20px 0;font-family:monospace;font-size:16px;letter-spacing:0.05em;color:#1C1917;word-break:break-all">${token}</div>
            <a href="${resetUrl}" style="display:inline-block;background:#1677FF;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin-bottom:16px">Reset my password</a>
            <p style="color:#78716C;font-size:12px">This link expires in 1 hour. If you did not request a reset, you can safely ignore this email.</p>
          </div>`,
      });
      this.logger.log(`Password reset email sent to ${to}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${to}: ${(err as Error).message}`);
      return false;
    }
  }
}
