import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Machine } from '../bot/machine.entity';
import { LoggerModule } from '../../utils/logger/logger.module';
import { MachineController } from './machine.controller';
import { MachineService } from './machine.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    Machine
  ]),LoggerModule],
  controllers: [MachineController],
  providers: [MachineService],
  exports: [MachineService],
})
export class MachineModule {}