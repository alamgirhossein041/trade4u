import { MailerService } from '@nestjs-modules/mailer';
import { HttpException, Injectable } from '@nestjs/common';
import { User } from '../../modules/user/user.entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  /**
   * Send Account Confirmation Email To User On Signup
   * @param email
   * @param token
   */
  public async sendEmailConfirmation(user: User, token: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      const url = process.env.APP_URL;
      const subRoute = 'ready_to_go';
      try {
        await this.mailerService.sendMail({
          to: user.email,
          from: '"Support Team" <support@binanceplus.com>', // override default from
          subject: 'Welcome to BinancePlus! Confirm your Email',
          html: `
                        <!DOCTYPE html>
<html>

<head>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap"
        rel="stylesheet">

    <title>Activate Email</title>

</head>

<body style="margin: 0; padding: 0;">
    <div style="background: #EAF0F6;
    text-align: center;
    font-family: Arial;
    padding: 3rem 0.5rem">
        <div style="margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    word-wrap: break-word;
    width: 100%;
    max-width: 425px;">

            <h2 style="font-style: normal;
        font-weight: normal;
        font-size: 1.688rem;
        line-height: 1.938rem;">
                Activate Email
            </h2>

            <div style="background: #1F1F20;
        display: flex;
        flex-direction: column;
        justify-content: center;
        max-width: 100%;
        width: auto;
        height: 143px;
        ">
                <img src='https://i.imgur.com/qH8mO8J.png' style="margin: 0 auto;
               max-width: 248px;
               width: 100%;
               height: auto;" />
            </div>

            <div style=" background: #F8F8FF;
        max-height: 100%;
        height: auto;
        text-align: left;
        padding: 10% 10%;">
                <h4 style=" font-style: normal;
            font-weight: normal;
            font-size: 1rem;
            line-height: 1.125rem;
            text-align: left;
            color: #000000;
            margin-bottom: 2rem;">
                    Your registration is almost complete!
                </h4>

                <p style="font-style: normal;
            font-weight: normal;
            font-size: 0.688rem;
            line-height: 0.813rem;
            color: #000000;
            margin-bottom: 2rem;">
                    If you are having trouble completing your registration, please don’t
                    hesitate to contact our customer service (available 24/7).
                </p>
                <a href="${url}${subRoute}?token=${token}" target="_blank" and rel="noopener noreferrer"
                style="  background: #F6DE23;
            border-radius: 0.375rem;
            padding: 3% 5%;
             font-weight: bolder;
            border-width: 0rem;
            text-decoration: none;
            color: #000;">
                    Activate Account
            </a>
            </div>
            <div style="  background: #1F1F20;
            text-align: center;
            max-width: 100%;
            width: auto;">
                <img src='https://i.imgur.com/qH8mO8J.png' style="   max-width: 132px;
                width: 100%;
                height: 100%;
                max-height: 40px;
                margin: 1rem;" />
                <p style="font-style: normal;
            font-weight: normal;
            font-size: 0.688rem;
            line-height: 0.813rem;
            color: #fff;
            margin-bottom: 2rem;">
                    Copyright©2022 Binaxx, All rights reserved
                </p>
                <a target="_blank" href="hhttps://www.instagram.com/accounts/login/" style="text-decoration:none;">
                    <img style=" height: 0.81rem;
            width: 0.81rem;
            border-radius: 0rem;
            margin:0 0 1.756rem 0.5rem;"
                        src='https://cdn.discordapp.com/attachments/939134175997472768/947784304740671528/youtube.png'
                        alt="youtube" />
                </a>
                <a target="_blank" href="https://www.linkedin.com/login" style="text-decoration:none;">
                    <img style=" height: 0.81rem;
            width: 0.81rem;
            border-radius: 0rem;
            margin:0 0 1.756rem 0.5rem;"
                        src='https://cdn.discordapp.com/attachments/939134175997472768/947784304996519966/insta.png'
                        alt="insta" />
                </a>
                <a target="_blank" href="https://www.facebook.com/login/" style="text-decoration:none;">
                    <img style=" height: 0.81rem;
            width: 0.81rem;
            border-radius: 0rem;
            margin:0 0 1.756rem 0.5rem;"
                        src='https://cdn.discordapp.com/attachments/939133756474785824/947785497151938610/Vector8.png'
                        alt="facebook" />
            </div>
        </div>

    </div>
</body>

</html>`,
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
    const subRoute = 'changepassword';
    await this.mailerService.sendMail({
      to: email,
      from: '"Support Team" <support@binanceplus.com>', // override default from
      subject: 'Binance+ ! Forgot Password',
      html: `<!DOCTYPE html>
<html>

<head>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap"
        rel="stylesheet">

    <title>Change Password</title>

</head>

<body>
    <div style="background: #EAF0F6;
    text-align: center;
    font-family: Arial;
    padding: 3rem 0.5rem">
        <div style="margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    word-wrap: break-word;
    width: 100%;
    max-width: 425px;">

            <h2 style="font-style: normal;
        font-weight: normal;
        font-size: 1.688rem;
        line-height: 1.938rem;">
                Change Password
            </h2>

            <div style="background: #1F1F20;
        display: flex;
        flex-direction: column;
        justify-content: center;
        max-width: 100%;
        width: auto;
        height: 143px;
        ">
                <img src='https://i.imgur.com/qH8mO8J.png' style="margin: 0 auto;
               max-width: 248px;
               width: 100%;
               height: auto;" />
            </div>

            <div style=" background: #F8F8FF;
        max-height: 100%;
        height: auto;
        text-align: left;
        padding: 10% 10%;">
                <h4 style=" font-style: normal;
            font-weight: normal;
            font-size: 1rem;
            line-height: 1.125rem;
            text-align: left;
            color: #000000;
            margin-bottom: 2rem;">
                    Your request for changing password
                </h4>

                <p style="font-style: normal;
            font-weight: normal;
            font-size: 0.688rem;
            line-height: 0.813rem;
            color: #000000;
            margin-bottom: 2rem;">
                    Click on the button below to change your password
                </p>
                <a href="${url}${subRoute}?token=${token}" target="_blank" and rel="noopener noreferrer"
                style="  background: #F6DE23;
            border-radius: 0.375rem;
            padding: 3% 5%;
             font-weight: bolder;
            border-width: 0rem;
            text-decoration: none;
            color: #000;">
                    Change Password
            </a>
            </div>
            <div style="  background: #1F1F20;
            text-align: center;
            max-width: 100%;
            width: auto;">
                <img src='https://i.imgur.com/qH8mO8J.png' style="   max-width: 132px;
                width: 100%;
                height: 100%;
                max-height: 40px;
                margin: 1rem;" />
                <p style="font-style: normal;
            font-weight: normal;
            font-size: 0.688rem;
            line-height: 0.813rem;
            color: #fff;
            margin-bottom: 2rem;">
                    Copyright©2022 Binaxx, All rights reserved
                </p>
                <a target="_blank" href="hhttps://www.instagram.com/accounts/login/" style="text-decoration:none;">
                    <img style=" height: 0.81rem;
            width: 0.81rem;
            border-radius: 0rem;
            margin:0 0 1.756rem 0.5rem;"
                        src='https://cdn.discordapp.com/attachments/939134175997472768/947784304740671528/youtube.png'
                        alt="youtube" />
                </a>
                <a target="_blank" href="https://www.linkedin.com/login" style="text-decoration:none;">
                    <img style=" height: 0.81rem;
            width: 0.81rem;
            border-radius: 0rem;
            margin:0 0 1.756rem 0.5rem;"
                        src='https://cdn.discordapp.com/attachments/939134175997472768/947784304996519966/insta.png'
                        alt="insta" />
                </a>
                <a target="_blank" href="https://www.facebook.com/login/" style="text-decoration:none;">
                    <img style=" height: 0.81rem;
            width: 0.81rem;
            border-radius: 0rem;
            margin:0 0 1.756rem 0.5rem;"
                        src='https://cdn.discordapp.com/attachments/939133756474785824/947785497151938610/Vector8.png'
                        alt="facebook" />
            </div>
        </div>

    </div>
</body>
</html>`,
    });
  }
}
