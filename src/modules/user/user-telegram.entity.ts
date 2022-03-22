import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryColumn
} from 'typeorm';

@Entity({
  name: 'user_telegram',
})
export class UserTelegram {
  @PrimaryColumn()
  chat_id: number;

  @Column({ length: 50 })
  name: string;

  @Column()
  code: number;

  @Column({default: false})
  isActive: boolean;

  @Column({default: false})
  tradeNotificationsActive: boolean;

  @Column({default: false})
  bonusNotificationsActive: boolean;

  @Column({default: false})
  systemNotificationsActive: boolean;

  @Column({default: false})
  promotionNotificationsActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
