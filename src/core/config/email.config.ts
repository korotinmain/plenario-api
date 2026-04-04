import { registerAs } from "@nestjs/config";

export default registerAs("email", () => ({
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  from: process.env.MAIL_FROM ?? "Plenario <no-reply@example.com>",
}));
