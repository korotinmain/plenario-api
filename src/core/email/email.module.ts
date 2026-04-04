import { Module, Global } from "@nestjs/common";
import { EMAIL_SERVICE } from "./email.interface";
import { ResendEmailService } from "./resend-email.service";

@Global()
@Module({
  providers: [{ provide: EMAIL_SERVICE, useClass: ResendEmailService }],
  exports: [EMAIL_SERVICE],
})
export class EmailModule {}
