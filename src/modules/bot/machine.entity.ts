import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'machine',
})
export class Machine {
  @PrimaryGeneratedColumn('uuid')
  machineid: string;

  @Column()
  machinename: string;

  @Column()
  ip: string;

  @Column()
  url: string;
}
