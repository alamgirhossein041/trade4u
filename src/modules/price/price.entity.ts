import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'prices',
})
export class Price {
  
  @PrimaryColumn()
  timestamp: number;
  
  @Column()
  currency: string; 

  @Column({
    type: 'double precision',
  })
  price: number;
}
