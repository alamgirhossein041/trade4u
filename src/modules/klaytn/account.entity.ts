import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'accounts',
})
export class Account {
  @PrimaryColumn()
  address: string;

  @Column()
  isHalt: boolean;
}
