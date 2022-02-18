import {
  Entity,
  OneToOne,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Crypto } from '../../utils/crypto';
import { BinanceApiCredsDto } from './commons/onboarding.dtos';
import { BaseEntity } from '../../utils/base.entity';

@Entity({
  name: 'binance_creds',
})
export class BinanceCreds extends BaseEntity {
  @Column({ length: 255 })
  apiKey: string;

  @Column({ length: 255 })
  secret: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  fromDto(body: BinanceApiCredsDto): BinanceCreds {
    this.apiKey = Crypto.encrypt(body.apiKey);
    this.secret = Crypto.encrypt(body.secret);

    return this;
  }
}
