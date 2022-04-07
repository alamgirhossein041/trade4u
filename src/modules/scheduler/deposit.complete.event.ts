import { Deposit } from '../payment/deposit.entity';
import { User } from '../user/user.entity';

export class DepositCompletedEvent {
  user: User;
  deposit: Deposit;
  bonusType: string;
}
