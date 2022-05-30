import { Module } from '@nestjs/common';
import { GcpSecretService } from './gcp.sm.service';

@Module({
  providers: [GcpSecretService],
  exports: [GcpSecretService],
})
export class GcpSecretModule {}
