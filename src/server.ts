import dotenv from 'dotenv';
dotenv.config();
import WebSocket from 'ws';
import http from 'http';
import { parse } from 'url';
import { Logger } from './utils/logger.util';
import { Socket } from 'net';
import { app } from "./app";
import ConnectionManager from './managers/connection.manager';

const port = process.env.PORT || 3000;

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

// Validate LLM socket connection path
server.on('upgrade', (request, socket: Socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.pathname;

    if (ConnectionManager.validateAndHandlePreConnection(pathname, socket)) {
        wss.handleUpgrade(request, socket, head, (llmWs) => {
            const emitResult = wss.emit('connection', llmWs, request);
            Logger.info(`Did emit socket connection, result: ${emitResult}`);
        });
    } else {
        Logger.error('ws path rejected: ', pathname);
    }
});

wss.on('connection', (ws, request) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.pathname;
    const queryParams = url.searchParams;

    ConnectionManager.handleConnection(ws, pathname);
});

wss.on('error', function error(e) {
    Logger.error('Captured WebSocket server error:', e);
});

server.listen(port, () => console.log(`Channel service listening on port ${port}`));
