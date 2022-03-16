import {
  Controller,
} from '@nestjs/common';
import { KlaytnService } from './klaytn.service';

@Controller('api/Klaytn')
export class KlaytnController {
  constructor(private readonly KlaytnService: KlaytnService) {}
}
