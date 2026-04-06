import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback, Profile } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(config: ConfigService) {
    super({
      clientID: config.getOrThrow<string>("auth.googleClientId"),
      clientSecret: config.getOrThrow<string>("auth.googleClientSecret"),
      callbackURL: config.getOrThrow<string>("auth.googleCallbackUrl"),
      scope: ["email", "profile"],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value ?? null;
    const googleProfile: GoogleProfile = {
      googleId: profile.id,
      email: email ?? "",
      name: profile.displayName ?? null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };
    done(null, googleProfile);
  }
}
