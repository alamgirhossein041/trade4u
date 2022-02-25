import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedModule } from '../../modules/seed/seed.module';
import { UserContoller } from './user.contoller';
import { UserStats } from './user-stats.entity';
import { User } from './user.entity';
import { UsersService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserStats]), SeedModule],
  exports: [UsersService],
  providers: [UsersService],
  controllers: [UserContoller],
})
export class UserModule {}
