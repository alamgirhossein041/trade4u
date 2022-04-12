import {
    Column,
    Entity,
    PrimaryColumn,
    OneToOne,
    JoinColumn
} from 'typeorm';
import { Bot } from './bot.entity';

@Entity({
    name: 'summary',
})
export class Summary {
    @PrimaryColumn()
    sid: string;

    @Column()
    totaltrades: number;

    @Column({
        type: 'double precision'
    })
    totalprofits: number;

    @Column({
        type: 'double precision'
    })
    lastmonthprofits: number;

    @Column({
        type: 'double precision'
    })
    lastthreemonthsprofit: number;

    @Column({
        type: 'double precision'
    })
    lastsixmonthsprofit: number;

    @Column({
        type: 'double precision'
    })
    lastyearprofit: number;

    @OneToOne(() => Bot)
    @JoinColumn({ name: 'botid' })
    bot: Bot;
}
