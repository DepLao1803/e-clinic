import { Injectable, Logger } from '@nestjs/common';
import { createTransport } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly log = new Logger(MailService.name);
  private readonly transport = createTransport({
    host: process.env.MAIL_HOST ?? 'localhost', port: Number(process.env.MAIL_PORT ?? 1025), secure: false,
  });

  async send(to: string, subject: string, html: string) {
    try {
      await this.transport.sendMail({ from: process.env.MAIL_FROM, to, subject, html });
    } catch (e) {
      this.log.warn(`Mail to ${to} failed: ${(e as Error).message}`); // never leak SMTP failures to the client
    }
  }
}
