import { Entity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { TelegramNotifyDto } from './commons/user.dtos';

@Entity({
  name: 'user_telegram',
})
export class UserTelegram {
  @PrimaryColumn()
  chat_id: number;

  @Column({ length: 50 })
  name: string;

  @Column({type: 'bigint'})
  code: number;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: false })
  tradeNotificationsActive: boolean;

  @Column({ default: false })
  bonusNotificationsActive: boolean;

  @Column({ default: false })
  systemNotificationsActive: boolean;

  @Column({ default: false })
  promotionNotificationsActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  fromNotifyDto(payload: TelegramNotifyDto): UserTelegram {
    this.bonusNotificationsActive = payload.bonusNotifications;
    this.systemNotificationsActive = payload.systemNotifications;
    this.promotionNotificationsActive = payload.promotionNotifications;
    this.tradeNotificationsActive = payload.tradingNotifications;

    return this;
  }
}
