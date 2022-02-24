import { MailerService } from '@nestjs-modules/mailer';
import { HttpException, Injectable } from '@nestjs/common';
import { User } from '../../modules/user/user.entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) { }

  /**
     * Send Account Confirmation Email To User On Signup
     * @param email
     * @param token
     */
  public async sendEmailConfirmation(user: User, token: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      const url = process.env.APP_URL;
      const subRoute = 'login';
      try {
        await this.mailerService.sendMail({
          to: user.email,
          from: '"Support Team" <support@binanceplus.com>', // override default from
          subject: 'Welcome to BinancePlus! Confirm your Email',
          html: `
                        <div style="width:100%;max-width:320px;margin:0 auto; padding: 1rem;display:block;font-family:Roboto">
                        <div>
                        <h4 style="color:#000;font-size:24px;font-family:Roboto;font-weight:600;width:100%;margin:0">Dear ${user.fullName},</h4>
                        <div style="padding:1rem 0;font-size:14px;font-family:Roboto;">
                            <p style="margin: 0; line-height: 20px; color: #181818;">To complete your sign up , please verify your email:</p>
                        </div>
                    
                        <a href="${url}${subRoute}?token=${token}"
                            style="background:#46a135;color:#fff;font-size:14px;font-family:Roboto;font-weight:500;margin:2rem auto;border-radius:5px;border:1px solid #46a135;width:100%;max-width:5rem;display:block;padding:0.75rem 1rem;text-align:center;text-decoration:none"
                            target="_blank"
                            data-saferedirecturl="#">Verify Email</a>
                            <h2 style="font-size: 2rem; font-weight:600; color: #4da43c; text-align: center;">Thank You!</h2>
                        </div>
                    </div>`,
        });
        resolve();
      } catch (err) {
        reject();
      }
    });
  }

  /**
   * Send Password Recovery Email To User on Forgot Password
   * @param email
   * @param token
   */
  async sendForgotPasswordMail(email: string, token: string) {
    const url = process.env.APP_URL;
    const subRoute = 'create_new_password';
    await this.mailerService.sendMail({
      to: email,
      from: '"Support Team" <support@binanceplus.com>', // override default from
      subject: 'Binance+ ! Forgot Password',
      html: `
              <p>
              We have received a forgot password request.
              Please <a href="${url}${subRoute}?token=${token}" class='btn btn-info'>Click here</a> to Change Your Password.
              
              If you have not performed this action, please contact support.

              Thanks,
              </p>
            `,
    });
  }
}
