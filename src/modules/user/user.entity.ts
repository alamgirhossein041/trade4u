import { RegisterPayload } from 'modules/auth';
import { Plan } from '../plan/plan.entity';
import { Entity, Column, ManyToOne, OneToOne } from 'typeorm';
import { PasswordTransformer } from './password.transformer';
import { BinanceCreds } from '../onboarding/binance_creds.entity';
import { BaseEntity } from '../../utils/base.entity';

@Entity({
  name: 'users',
})
export class User extends BaseEntity {
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

  @ManyToOne(() => Plan, (plan) => plan.users)
  plan: Plan;

  @OneToOne(() => BinanceCreds, (binanceCreds) => binanceCreds.user, {
    cascade: ['insert', 'update'],
  })
  binanceCreds: BinanceCreds;

  toJSON() {
    const { password, ...self } = this;
    return self;
  }

  toDto() {
    const { password, ...dto } = this;
    return dto;
  }

  fromDto(payload: RegisterPayload) {
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
