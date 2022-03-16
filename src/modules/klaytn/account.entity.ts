import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'accounts',
})
export class Account {

  @PrimaryColumn()
  address: string;

  @Column()
  isHalt: boolean;
}
