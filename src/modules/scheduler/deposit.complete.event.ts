import { User } from '../user/user.entity';

export class DepositCompletedEvent {
  user: User;
  txHash: string;
  bonusType: string;
}
