import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedModule } from '../../modules/seed/seed.module';
import { UserContoller } from './user.contoller';
import { UserStats } from './user-stats.entity';
import { User } from './user.entity';
import { UsersService } from './user.service';
import { CompensationTransaction } from './compensation.transaction';
import { LicenseFee } from '../seed/licensefee.entity';
import { LoggerModule } from '../../utils/logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserStats, LicenseFee]),
    SeedModule,
    LoggerModule,
  ],
  exports: [UsersService],
  providers: [UsersService, CompensationTransaction],
  controllers: [UserContoller],
})
export class UserModule {}
