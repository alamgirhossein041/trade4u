import {
  HttpException,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseCode, ResponseMessage } from '../../utils/enum';
import { User, UserFillableFields } from './user.entity';

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
   * Create a new user
   * @param payload
   * @returns
   */
  async create(payload: UserFillableFields) {
    const user = await this.getByEmail(payload.email);

    if (user) {
      throw new HttpException(
        ResponseMessage.USER_ALREADY_EXISTS,
        ResponseCode.BAD_REQUEST,
      );
    }
    return await this.userRepository.save(payload);
  }
}
