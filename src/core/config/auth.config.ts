import { registerAs } from "@nestjs/config";

export default registerAs("auth", () => ({
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? "access_secret",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "refresh_secret",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ??
    "http://localhost:3000/auth/google/callback",
}));
