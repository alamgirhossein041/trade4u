import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../../utils/mailer/mail.service';
import { RegisterPayload } from '.';
import { ResponseCode, ResponseMessage } from '../../utils/enum';
import { Hash } from '../../utils/Hash';
import { User, UsersService } from './../user';
import { LoginPayload } from './login.payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly mailerservice: MailService,
  ) { }

  /**
   * Create new jwt token
   * @param user
   * @returns
   */
  async createToken(user: User) {
    return {
      expiresIn: process.env.JWT_EXPIRATION_TIME,
      accessToken: this.jwtService.sign({ uuid: user.uuid }),
      user,
    };
  }

  /**
   * Create Forgot Password jwt token
   * @param user
   * @returns
   */
  async createForgotPasswordToken(user: User) {
    const accessToken = this.jwtService.sign({ uuid: user.uuid }, { expiresIn: process.env.JWT_TIME_FORGOT_PASSWORD })
    return accessToken;
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
   * Send Password Recovery Link To User Email
   * @param email
   * @returns
   */
  public async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.getByEmail(email);
    if (user) {
      const token = await this.createForgotPasswordToken(user);
      await this.mailerservice.sendForgotPasswordMail(
        user.email,
        token
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
        ResponseMessage.USER_DOES_NOT_EXIST,
        ResponseCode.BAD_REQUEST,
      );
    }
    if (!user.emailConfirmed) {
      throw new HttpException(
        ResponseMessage.CONFIRM_EMAIL_FIRST,
        ResponseCode.BAD_REQUEST,
      );
    }
    if (!user || !Hash.compare(payload.password, user.password)) {
      throw new HttpException(
        ResponseMessage.INVALID_CREDENTIALS,
        ResponseCode.BAD_REQUEST,
      );
    }
    return user;
  }
}
