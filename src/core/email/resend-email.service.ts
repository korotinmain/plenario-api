import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { IEmailService } from "./email.interface";

@Injectable()
export class ResendEmailService implements IEmailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly frontendUrl: string;
  private readonly logger = new Logger(ResendEmailService.name);

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.getOrThrow<string>("email.resendApiKey");
    this.from = this.config.getOrThrow<string>("email.from");
    this.frontendUrl =
      this.config.get<string>("app.frontendUrl") ?? "http://localhost:4000";
    this.resend = new Resend(apiKey);
  }

  async sendEmailConfirmation(
    to: string,
    name: string | null,
    link: string,
  ): Promise<void> {
    const displayName = name ?? to;
    await this.resend.emails.send({
      from: this.from,
      to,
      subject: "Confirm your Plenario account",
      html: this.confirmationHtml(displayName, link),
    });
    this.logger.log(`Confirmation email sent to ${to}`);
  }

  async sendPasswordReset(
    to: string,
    name: string | null,
    link: string,
  ): Promise<void> {
    const displayName = name ?? to;
    await this.resend.emails.send({
      from: this.from,
      to,
      subject: "Reset your Plenario password",
      html: this.passwordResetHtml(displayName, link),
    });
    this.logger.log(`Password reset email sent to ${to}`);
  }

  private confirmationHtml(name: string, link: string): string {
    return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f9f9f9;padding:40px 0;margin:0">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;padding:40px">
        <tr><td>
          <h2 style="margin:0 0 16px">Welcome to Plenario, ${this.esc(name)}!</h2>
          <p style="color:#555;margin:0 0 24px">Please confirm your email address to get started.</p>
          <a href="${this.esc(link)}"
             style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600">
            Confirm email
          </a>
          <p style="color:#999;font-size:13px;margin:24px 0 0">
            Or copy this link into your browser:<br>
            <span style="word-break:break-all">${this.esc(link)}</span>
          </p>
          <p style="color:#bbb;font-size:12px;margin:16px 0 0">This link expires in 24 hours.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private passwordResetHtml(name: string, link: string): string {
    return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f9f9f9;padding:40px 0;margin:0">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;padding:40px">
        <tr><td>
          <h2 style="margin:0 0 16px">Reset your password, ${this.esc(name)}</h2>
          <p style="color:#555;margin:0 0 24px">Click the button below to choose a new password.</p>
          <a href="${this.esc(link)}"
             style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600">
            Reset password
          </a>
          <p style="color:#999;font-size:13px;margin:24px 0 0">
            Or copy this link into your browser:<br>
            <span style="word-break:break-all">${this.esc(link)}</span>
          </p>
          <p style="color:#bbb;font-size:12px;margin:16px 0 0">This link expires in 1 hour. If you did not request a password reset, you can ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private esc(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
