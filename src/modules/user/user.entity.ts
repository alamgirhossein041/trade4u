import { RegisterPayload } from '../auth/register.payload';
import { UserStats } from './user-stats.entity';
import {
  Entity,
  Column,
  OneToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Crypto } from '../../utils/crypto';
import { Plan } from '../seed/plan.entity';
import { UserTelegram } from './telegram.entity';
import { IsNotEmpty, Matches } from 'class-validator';
import { IsValidCountry } from '../../modules/common/validator/country.validator';
import { IsValidPhoneNumber } from '../../modules/common/validator/phone.validator';
import { ResponseMessage } from '../../utils/enum';
import moment from 'moment';

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

  @Column({ length: 10, nullable: true })
  tradingSystem: string;

  @Column({ length: 255, nullable: true })
  apiKey: string;

  @Column({ length: 255, nullable: true })
  apiSecret: string;

  @Column({ nullable: true })
  apiActivationDate: number;

  @Column({ nullable: true })
  tradeStartDate: number;

  @Column({ nullable: true })
  tradeExpiryDate: number;

  @Column({ length: 150, nullable: true })
  klayWallet: string;

  @Column({ default: 0, type: 'double precision' })
  balance: number;

  @Column({ type: 'boolean', default: false })
  planIsActive: boolean;

  @Column({ nullable: true })
  planExpiry: number;

  @Column({ type: 'boolean', default: false })
  emailConfirmed: boolean;

  @Column({ type: 'uuid', default: null })
  refereeUuid: string;

  @Column({
    name: 'password',
    length: 255,
  })
  password: string;

  @Column({ default: null })
  profileCode: number;

  @Column({ default: moment().unix() })
  createdAt: number;

  @OneToOne(() => UserStats)
  @JoinColumn()
  userStats: UserStats;

  @OneToOne(() => UserTelegram)
  @JoinColumn({ name: 'telegramId' })
  userTelegram: UserTelegram;

  @ManyToOne(() => Plan)
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

export class UserDataDto {
  address: string;

  @IsNotEmpty()
  @IsValidPhoneNumber()
  phoneNumber: string;

  userTelegram: string;

  @IsNotEmpty()
  @Matches(/^[a-zA-Z ]{3,26}$/, {
    message: ResponseMessage.INVALID_NAME,
  })
  fullName: string;

  @IsNotEmpty()
  @IsValidCountry()
  country: string;
}
