import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../../utils/mailer/mail.service';
import { RegisterPayload } from '.';
import { ResponseCode, ResponseMessage } from '../../utils/enum';
import { Hash } from '../../utils/Hash';
import { User, UsersService } from './../user';
import { LoginPayload } from './login.payload';
import { TelegramService } from '../../utils/telegram/telegram-bot.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly mailerservice: MailService,
    private readonly telegramService: TelegramService,
  ) {}

  /**
   * Create new jwt token
   * @param user
   * @returns
   */
  async createToken(
    user: User,
    expiryTime?: number | string,
    subject?: string,
  ) {
    return {
      expiresIn: process.env.JWT_EXPIRATION_TIME,
      accessToken: this.jwtService.sign(
        { uuid: user.uuid },
        {
          subject: subject ? process.env.JWT_SECRET_KEY + user.password : '',
          expiresIn: expiryTime ? expiryTime : process.env.JWT_EXPIRATION_TIME,
        },
      ),
      user,
    };
  }

  async checkPasswordLinkExpiry(email: string, token: string) {
    try {
      const user = await this.userService.getByEmail(email);
      const subject = process.env.JWT_SECRET_KEY + user.password;
      this.jwtService.verify(token, { subject });
      return;
    } catch (err) {
      throw new HttpException(
        ResponseMessage.RESET_PASSWORD_LINK_EXPIRED,
        ResponseCode.NOT_FOUND,
      );
    }
  }

  /**
   * Register a genesis user
   * @param payload
   * @returns
   */
  public async registerGenesisUser(payload: RegisterPayload): Promise<User> {
    return new Promise<User>(async (resolve, reject) => {
      await this.userService
        .createGenesisUser(payload)
        .then(async (user: User) => {
          try {
            const token = await this.createToken(user);
            await this.mailerservice.sendEmailConfirmation(
              user,
              token.accessToken,
            );
            return resolve(user);
          } catch (err) {
            await this.userService.remove(user);
            throw new HttpException(
              ResponseMessage.CHECK_INTERNET_CONNECTION,
              ResponseCode.BAD_REQUEST,
            );
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * Register a new user
   * @param payload
   * @returns
   */
  public async register(
    payload: RegisterPayload,
    referrer: string,
  ): Promise<User> {
    return new Promise<User>(async (resolve, reject) => {
      await this.userService
        .create(payload, referrer)
        .then(async (user: User) => {
          try {
            const referrerDtl = await this.userService.getByUserName(referrer);
            const token = await this.createToken(user);
            await this.mailerservice.sendEmailConfirmation(
              user,
              token.accessToken,
            );
            if (referrerDtl.userTelegram && referrerDtl.userTelegram.isActive) {
              const telegram = referrerDtl.userTelegram;
              if (
                telegram.systemNotificationsActive &&
                TelegramService.connected
              ) {
                await this.telegramService.sendReferralNotification(
                  telegram,
                  payload.userName,
                );
              }
            }
            return resolve(user);
          } catch (err) {
            await this.userService.remove(user);
            throw new HttpException(
              ResponseMessage.CHECK_INTERNET_CONNECTION,
              ResponseCode.BAD_REQUEST,
            );
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * Resend a email to user
   * @param email
   * @returns
   */
  public async resendEmail(email: string) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const user = await this.userService.getByEmail(email);
        if (!user)
          reject(
            new HttpException(
              ResponseMessage.USER_DOES_NOT_EXIST,
              ResponseCode.BAD_REQUEST,
            ),
          );
        const token = await this.createToken(user);
        await this.mailerservice.sendEmailConfirmation(user, token.accessToken);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Send Password Recovery Link To User Email
   * @param email
   * @returns
   */
  public async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.getByEmail(email);
    if (user) {
      const token = await this.createToken(
        user,
        process.env.JWT_TIME_FORGOT_PASSWORD,
        user.password,
      );
      await this.mailerservice.sendForgotPasswordMail(
        user.email,
        token.accessToken,
      );
      return;
    } else {
      throw new HttpException(
        ResponseMessage.EMAIL_NOT_REGISTERED,
        ResponseCode.NOT_FOUND,
      );
    }
  }

  /**
   * Confirm the forgot password and update
   * @param email
   * @param password
   * @returns
   */
  public async confirmForgotPassword(email: string, password: string) {
    await this.userService.confirmForgotPassword(email, password);
    return;
  }

  /**
   * Confirm User Email
   * @param user
   * @returns
   */
  public async confirmEmail(user: User): Promise<User> {
    if (user.emailConfirmed)
      throw new HttpException(
        ResponseMessage.EMAIL_LINK_EXPIRED,
        ResponseCode.BAD_REQUEST,
      );
    return await this.userService.updateEmailStatus(user);
  }

  /**
   * Validate a user
   * @param payload
   * @returns
   */
  async validateUser(payload: LoginPayload): Promise<User> {
    const user = await this.userService.getByEmail(payload.email);
    if (!user) {
      throw new HttpException(
        ResponseMessage.INVALID_USERNAME_OR_PASSWORD,
        ResponseCode.BAD_REQUEST,
      );
    }
    if (!user.emailConfirmed) {
      throw new HttpException(
        ResponseMessage.CONFIRM_EMAIL_FIRST,
        ResponseCode.BAD_REQUEST,
      );
    }
    const isValidPassword = await Hash.compare(payload.password, user.password);
    if (!user || !isValidPassword) {
      throw new HttpException(
        ResponseMessage.INVALID_USERNAME_OR_PASSWORD,
        ResponseCode.BAD_REQUEST,
      );
    }
    return user;
  }
}
