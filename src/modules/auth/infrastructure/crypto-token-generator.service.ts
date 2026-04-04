import { Injectable } from "@nestjs/common";
import { randomBytes, createHash } from "crypto";
import {
  ITokenGenerator,
  GeneratedToken,
} from "../domain/services/token-generator.interface";

@Injectable()
export class CryptoTokenGenerator implements ITokenGenerator {
  async generate(): Promise<GeneratedToken> {
    const raw = randomBytes(32).toString("hex");
    const hash = createHash("sha256").update(raw).digest("hex");
    return { raw, hash };
  }
}
