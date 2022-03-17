import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedModule } from '../../modules/seed/seed.module';
import { UserContoller } from './user.contoller';
import { UserStats } from './user-stats.entity';
import { User } from './user.entity';
import { UsersService } from './user.service';
import { LicenseFee } from '../seed/licensefee.entity';
import { LoggerModule } from '../../utils/logger/logger.module';
import { BinanceModule } from '../../utils/binance/binance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserStats, LicenseFee]),
    SeedModule,
    LoggerModule,
    BinanceModule
  ],
  exports: [UsersService],
  providers: [UsersService],
  controllers: [UserContoller],
})
export class UserModule {}
