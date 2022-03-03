import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { SeedModule } from '../../modules/seed/seed.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), SeedModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
