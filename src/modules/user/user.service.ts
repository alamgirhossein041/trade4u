import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  async get(id: number) {
    return this.userRepository.findOne({ id });
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
      throw new NotAcceptableException(
        'User with provided email already created.',
      );
    }

    return await this.userRepository.save(payload);
  }
}
