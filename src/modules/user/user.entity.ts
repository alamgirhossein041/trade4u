import { RegisterPayload } from '../auth/register.payload';
import { UserStats } from './user-stats.entity';
import {
  Entity,
  Column,
  OneToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { PasswordTransformer } from './password.transformer';
import { Crypto } from '../../utils/crypto';
import { Plan } from '../seed/plan.entity';

@Entity({
  name: 'users',
})
export class User {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ length: 255 })
  userName: string;

  @Column({ length: 255 })
  fullName: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 255 })
  country: string;

  @Column({ length: 255 })
  phoneNumber: string;

  @Column({ length: 255 })
  referralLink: string;

  @Column({ length: 35, nullable: true })
  apiKey: string;

  @Column({ length: 35, nullable: true })
  apiSecret: string;

  @Column({ type: 'boolean', default: false })
  planIsActive: boolean;

  @Column({ type: 'boolean', default: false })
  emailConfirmed: boolean;

  @Column({ type: 'uuid', default: null })
  refereeUuid: string;

  @Column({
    name: 'password',
    length: 255,
    transformer: new PasswordTransformer(),
  })
  password: string;

  @OneToOne(() => UserStats)
  @JoinColumn()
  userStats: UserStats;

  @OneToOne(() => Plan)
  @JoinColumn()
  plan: Plan;

  toJSON() {
    const { password, ...self } = this;
    return self;
  }

  toDto() {
    const { password, ...dto } = this;
    if (dto.apiKey) dto.apiKey = Crypto.decrypt(dto.apiKey);
    if (dto.apiSecret) dto.apiSecret = Crypto.decrypt(dto.apiSecret);
    return dto;
  }

  fromDto(payload: RegisterPayload): User {
    this.userName = payload.userName;
    this.fullName = payload.fullName;
    this.email = payload.email;
    this.country = payload.country;
    this.phoneNumber = payload.phoneNumber;
    this.password = payload.password;

    return this;
  }
}

export class UserFillableFields {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}
