import { Controller, Post, UseGuards } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @UseGuards(AuthGuard())
  @Post()
  public async createGenesisUser() {}
}
