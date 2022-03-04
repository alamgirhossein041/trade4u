import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'accounts',
})
export class Account {
  @PrimaryColumn()
  position: Number;

  @Column()
  address: string;

  @Column()
  isHalt: boolean;
}
