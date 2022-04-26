import { Module } from '@nestjs/common';
import { SocketController } from './socket.controller';
import { SocketService } from './socket.service';

@Module({
  exports: [SocketService],
  controllers: [SocketController],
  providers: [SocketService],
})
export class SocketModule {}
