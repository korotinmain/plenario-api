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
    const safeName = this.esc(name);
    const safeLink = this.esc(link);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Confirm your Plenario account</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:48px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.08);overflow:hidden;">

          <!-- Top accent bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#18181b 0%,#3f3f46 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 48px 40px;">

              <!-- Wordmark -->
              <p style="margin:0 0 36px;font-size:20px;font-weight:700;letter-spacing:-0.5px;color:#18181b;">
                Plenario
              </p>

              <!-- Heading -->
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#18181b;line-height:1.3;">
                Welcome, ${safeName}!
              </h1>

              <!-- Body text -->
              <p style="margin:0 0 32px;font-size:15px;color:#52525b;line-height:1.6;">
                Thanks for signing up. Just one more step — confirm your email address and you're all set to start planning.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="border-radius:8px;background:#18181b;">
                    <a href="${safeLink}"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.1px;">
                      Confirm my email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-top:1px solid #e4e4e7;font-size:0;height:1px;">&nbsp;</td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin:0;font-size:12px;color:#71717a;word-break:break-all;">
                ${safeLink}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 48px 32px;background:#fafafa;border-top:1px solid #f0f0f0;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.5;">
                This link expires in <strong>24 hours</strong>. If you didn't create a Plenario account, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private passwordResetHtml(name: string, link: string): string {
    const safeName = this.esc(name);
    const safeLink = this.esc(link);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Reset your Plenario password</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:48px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.08);overflow:hidden;">

          <!-- Top accent bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#18181b 0%,#3f3f46 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 48px 40px;">

              <!-- Wordmark -->
              <p style="margin:0 0 36px;font-size:20px;font-weight:700;letter-spacing:-0.5px;color:#18181b;">
                Plenario
              </p>

              <!-- Icon -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="width:44px;height:44px;border-radius:10px;background:#f4f4f5;text-align:center;vertical-align:middle;font-size:22px;">
                    🔑
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#18181b;line-height:1.3;">
                Reset your password
              </h1>

              <!-- Body text -->
              <p style="margin:0 0 32px;font-size:15px;color:#52525b;line-height:1.6;">
                Hi ${safeName}, we received a request to reset the password for your Plenario account. Click the button below to choose a new one.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="border-radius:8px;background:#18181b;">
                    <a href="${safeLink}"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.1px;">
                      Reset my password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-top:1px solid #e4e4e7;font-size:0;height:1px;">&nbsp;</td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin:0;font-size:12px;color:#71717a;word-break:break-all;">
                ${safeLink}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 48px 32px;background:#fafafa;border-top:1px solid #f0f0f0;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.5;">
                This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password will not change.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
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
