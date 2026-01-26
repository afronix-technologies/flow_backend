import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class NotificationsGateway {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationsGateway.name);

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(client: Socket, room: string) {
        client.join(room);
        this.logger.log(`Client ${client.id} joined room: ${room}`);
    }

    sendToUser(userId: string, message: any) {
        this.server.to(`user_${userId}`).emit('notification', message);
    }

    sendToOrganization(orgId: string, message: any) {
        this.server.to(`org_${orgId}`).emit('notification', message);
    }
}
