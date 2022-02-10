import { Global, Module } from '@nestjs/common';
import { ExistsValidator } from './validator/exists.validator';

@Global()
@Module({
  providers: [ExistsValidator],
})
export class CommonModule {}
