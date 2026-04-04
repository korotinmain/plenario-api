import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import { IPasswordHasher } from "../domain/services/password-hasher.interface";

@Injectable()
export class ArgonPasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return argon2.hash(plain);
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}
