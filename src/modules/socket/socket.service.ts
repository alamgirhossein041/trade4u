import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Notifications } from './commons/socket.enum';

@WebSocketGateway(Number(process.env.APP_PORT), {
  cors: {
    origin: '*',
  },
})
export class SocketService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger: Logger = new Logger('AppGateway');
  @WebSocketServer()
  server: Server;

  public afterInit(server: Server) {
    this.logger.log('Initialized .....');
  }

  public handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  public handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  public async emitNotification(email: string, Notification: Notifications) {
    return this.server.to(email).emit(Notification);
  }

  @SubscribeMessage('join')
  public createRoom(client: Socket, email: string) {
    client.join(email);
    this.logger.log(`room created: ${email}`);
  }
}
