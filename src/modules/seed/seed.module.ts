import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenseFee } from './licensefee.entity';
import { Plan } from './plan.entity';
import { PerformanceFee } from './preformaceFee.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, LicenseFee, PerformanceFee])],
  exports: [SeedService],
  providers: [SeedService],
})
export class SeedModule {}
