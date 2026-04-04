export const EMAIL_SERVICE = Symbol("EMAIL_SERVICE");

export interface IEmailService {
  sendEmailConfirmation(
    to: string,
    name: string | null,
    link: string,
  ): Promise<void>;
  sendPasswordReset(
    to: string,
    name: string | null,
    link: string,
  ): Promise<void>;
}
