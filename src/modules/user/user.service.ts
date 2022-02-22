import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterPayload } from 'modules/auth';
import { Repository } from 'typeorm';
import { ResponseCode, ResponseMessage } from '../../utils/enum';
import { UserStats } from './user-stats.entity';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserStats)
    private readonly userStatsRepository: Repository<UserStats>,
  ) {}

  /**
   * Get user by id
   * @param id
   * @returns
   */
  async get(uuid: string): Promise<User> {
    return this.userRepository.findOne({ uuid });
  }

  /**
   * Get user by email
   * @param email
   * @returns
   */
  async getByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({ email });
  }

  /**
   * Get user by email
   * @param username
   * @returns
   */
  async getByUserName(userName: string): Promise<User> {
    return await this.userRepository.findOne({ userName });
  }

  /**
   * Create a new user
   * @param payload
   * @returns
   */
  async create(payload: RegisterPayload):Promise<User> {
    const user = await this.getByEmail(payload.email);
    if (user) {
      throw new HttpException(
        ResponseMessage.USER_ALREADY_EXISTS,
        ResponseCode.BAD_REQUEST,
      );
    }
    const newUser = new User().fromDto(payload);
    newUser.referralLink = this.getReferralLink(newUser);
    return await this.userRepository.save(newUser);
  }

  /**
   * Create user referral link
   * @param username
   * @returns
   */
  public getReferralLink(user: User): string {
    const link = process.env.APP_URL + `signup?referrer=` + user.userName;
    return link;
  }

  /**
   * Initiate user stats
   * @returns
   */
  public async initializeStats(): Promise<UserStats> {
    let userStats: UserStats;
    userStats = new UserStats();
    return this.userStatsRepository.save(userStats);
  }

  /**
   * Create a new user
   * @param payload
   * @returns
   */
  async createUser(payload: RegisterPayload, referrer: string): Promise<User> {
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
    newUser.userStats = await this.initializeStats();
    newUser.referralLink = this.getReferralLink(newUser);
    newUser.refereeUuid = referee.uuid;
    return await this.userRepository.save(newUser);
  }

  /**
   * Update user email status
   * @param user
   * @returns
   */
  async updateEmailStatus(user: User): Promise<User> {
    user.emailConfirmed = true;
    return await this.userRepository.save(user);
  }

  /**
   * Forget password confirmation
   * @param email 
   * @param password 
   * @returns 
   */
  public async confirmForgotPassword(email: string, password: string): Promise<User> {
    const user: User = await this.userRepository.findOne({ email });
    if (user) {
      await this.userRepository.update({ email }, { password })
      return user;
    } else {
      throw new HttpException(ResponseMessage.USER_DOES_NOT_EXIST,ResponseCode.NOT_FOUND);
    }
  }

  /**
   * Remove a user
   */
  async remove(user: User) {
    await this.userRepository.delete({ uuid: user.uuid });
  }
}
