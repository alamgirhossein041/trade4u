import {
  Column,
  Entity,
  PrimaryColumn
} from 'typeorm';

@Entity({
  name: 'deficit_deposits'
})
export class DeficitDeposit {
  @PrimaryColumn()
  txHash: string;

  @Column()
  userId: string;
}
