import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'information',
})
export class Information {
  @PrimaryColumn()
  keyName: string;

  @Column({ type: 'bigint' })
  value: number;
}
