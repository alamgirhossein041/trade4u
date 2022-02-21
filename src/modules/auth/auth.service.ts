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
  ) {}

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
   * Register a new user
   * @param payload
   * @returns
   */
  public async register(payload: RegisterPayload): Promise<User> {
    return new Promise<User>(async (resolve, reject) => {
      await this.userService
        .create(payload)
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
  public async registerUser(
    payload: RegisterPayload,
    referrer: string,
  ): Promise<User> {
    return new Promise<User>(async (resolve, reject) => {
      await this.userService
        .createUser(payload, referrer)
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
   * Confirm a Mail
   * @param user
   * @returns
   */
  public async confirmEmail(user: User): Promise<User> {
    return await this.userService.updateEmailStatus(user);
  }

  /**
   * Validate a user
   * @param payload
   * @returns
   */
  async validateUser(payload: LoginPayload): Promise<any> {
    const user = await this.userService.getByEmail(payload.email);
    if (!user || !Hash.compare(payload.password, user.password)) {
      throw new HttpException(
        ResponseMessage.INVALID_CREDENTIALS,
        ResponseCode.BAD_REQUEST,
      );
    }
    return user;
  }
}
