import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterPayload } from 'modules/auth';
import { Repository } from 'typeorm';
import { ResponseCode, ResponseMessage } from '../../utils/enum';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get user by id
   * @param id
   * @returns
   */
  async get(uuid: string) {
    return this.userRepository.findOne({ uuid });
  }

  /**
   * Get user by email
   * @param email
   * @returns
   */
  async getByEmail(email: string) {
    return await this.userRepository.findOne({ email });
  }

  /**
   * Get user by email
   * @param username
   * @returns
   */
  async getByUserName(userName: string) {
    return await this.userRepository.findOne({ userName });
  }

  /**
   * Create a new user
   * @param payload
   * @returns
   */
  async create(payload: RegisterPayload) {
    const user = await this.getByEmail(payload.email);
    if (user) {
      throw new HttpException(
        ResponseMessage.USER_ALREADY_EXISTS,
        ResponseCode.BAD_REQUEST,
      );
    }
    const newUser = new User().fromDto(payload);
    newUser.referralLink = this.getReferralLink(newUser.userName);
    return await this.userRepository.save(newUser);
  }

  /**
   * Create user referral link
   * @param username
   * @returns
   */
  public getReferralLink(userName: string): string {
    const link = process.env.APP_URL + `signup?referrer=` + userName;
    return link;
  }

  /**
   * Create a new user
   * @param payload
   * @returns
   */
  async createUser(payload: RegisterPayload, referrer: string) {
    const referee = await this.getByUserName(referrer);
    if (!referee) {
      throw new HttpException(
        ResponseMessage.INVALID_REFERRER_USERNAME,
        ResponseCode.BAD_REQUEST,
      );
    }
    const userNameTaken = await this.getByUserName(payload.userName);
    if (userNameTaken) {
      throw new HttpException(
        ResponseMessage.USERNAME_ALREADY_TAKEN,
        ResponseCode.BAD_REQUEST,
      );
    }
    const user = await this.getByEmail(payload.email);
    if (user) {
      throw new HttpException(
        ResponseMessage.USER_ALREADY_EXISTS,
        ResponseCode.BAD_REQUEST,
      );
    }
    const newUser = new User().fromDto(payload);
    newUser.referralLink = this.getReferralLink(user.userName);
    newUser.refereeUuid = referee.uuid;
    return await this.userRepository.save(newUser);
  }

  /**
   * Create a new user
   * @param payload
   * @returns
   */
  async updateEmailStatus(user: User) {
    user.emailConfirmed = true;
    return await this.userRepository.save(user);
  }

  /**
   * Remove a user
   */
  async remove(user: User) {
    await this.userRepository.delete({ uuid: user.uuid });
  }
}
