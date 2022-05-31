import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        service: 'sendgrid',
        host: 'smtp.sendgrid.net',
        secure: false,
        auth: {
          user: 'apikey',
          pass: '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',
        },
      },
      defaults: {
        from: 'do-not-replay@binanceplus.io',
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService], // 👈 export for DI
})
export class MailModule {}
