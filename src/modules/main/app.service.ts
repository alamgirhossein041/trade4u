import { Injectable } from '@nestjs/common';
import { ConfigService } from './../config';

@Injectable()
export class AppService {
  static port: number;
  constructor(private config: ConfigService) {
    AppService.port = Number(this.config.get('APP_PORT'));
  }

  root(): string {
    return this.config.get('APP_URL');
  }
}
