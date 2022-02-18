import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanController } from './plan.controller';
import { Plan } from './plan.entity';
import { PlanService } from './plan.service';

@Module({
  imports: [TypeOrmModule.forFeature([Plan])],
  exports: [PlanService],
  providers: [PlanService],
  controllers: [PlanController],
})
export class PlanModule {}
