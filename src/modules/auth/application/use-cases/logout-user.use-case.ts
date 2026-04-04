import { Injectable } from "@nestjs/common";

@Injectable()
export class LogoutUserUseCase {
  execute(): { message: string } {
    // v1 baseline: client discards tokens. Server-side invalidation added when refresh token persistence is implemented.
    return { message: "Logged out successfully" };
  }
}
