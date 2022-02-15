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
    return await this.userRepository.save(newUser);
  }

  /**
   * Remove a user
   */
  async remove(user: User) {
    await this.userRepository.delete({ uuid: user.uuid });
  }
}
