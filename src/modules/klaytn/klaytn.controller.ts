import { Controller, Get } from '@nestjs/common';
import { KlaytnService } from './klaytn.service';

@Controller('api/Klaytn')
export class KlaytnController {
  constructor(private readonly KlaytnService: KlaytnService) {}

  @Get(`send`)
  public async orderPlan() {}
}
