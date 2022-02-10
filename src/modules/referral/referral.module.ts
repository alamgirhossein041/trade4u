import { Module } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';

@Module({
  controllers: [ReferralController],
  providers: [ReferralService],
})
export class ReferralModule {}
