import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*', // Adjust for production security
    },
    namespace: 'auth'
})
export class AuthGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('AuthGateway');

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    sendWelcomeMessage(userId: string, message: string) {
        // In a real app, map userId to socketId to send targeted message
        // For this demo/requirement, we might broadcast or just log if no specific targeting logic yet
        // Assuming the client joins a room named after their userId upon connection from frontend
        this.server.to(userId).emit('welcome', { message });
        this.logger.log(`Sent welcome message to ${userId}`);
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(client: Socket, userId: string) {
        client.join(userId);
        this.logger.log(`Client ${client.id} joined room ${userId}`);
        return { event: 'joinedRoom', data: userId };
    }
}
