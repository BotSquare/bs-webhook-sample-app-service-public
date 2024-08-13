import WebSocket from 'ws';
import { Socket } from 'net';
import { Logger } from '../utils/logger.util';
import SessionManager from './session.manager';
import LimitedArray from '../utils/limitedArray.util';
const DEFAULT_CLIENT_ID = 'default-client-id';

interface FeWsMessage {
    type: 'static' | 'stream',
    id: string
    delta?: string
    content?: string
}

const processedMsgs = new LimitedArray<string>();

export default class ConnectionManager {
    static validateAndHandlePreConnection(pathname: string, socket: Socket): boolean {
        // Only /session/{session-id} or /session/{session-id}/{client-id} or /hook/{session-id} paths are allowed
        if (!/^\/(session|hook)\/[a-zA-Z0-9-_]+(\/[a-zA-Z0-9-_]+){0,2}$/.test(pathname)) {
            Logger.error('WS connection validation failed. Invalid ws path, rejecting. Path received:', pathname);
            socket.destroy();
            return false;
        }

        // Proceed to connect
        return true;
    }

    static handleConnection(ws: WebSocket, pathname: string): void {
        // Save ws object on connection ,if its a /session connection
        if (pathname.startsWith('/session')) {
            
            // Extract session id
            const sessionPathSegments = pathname.split('/');
            if (sessionPathSegments.length !== 3 && sessionPathSegments.length !== 4) {
                Logger.error('Not able to handle /session ws msg, invalid path', pathname);
                return;
            }
            const sessionId = sessionPathSegments[2];
            let clientId: string = DEFAULT_CLIENT_ID;
            if (sessionPathSegments.length === 4) clientId = sessionPathSegments[3];

            if (!SessionManager.updateSessionWithWS(sessionId, clientId, ws)) throw new Error(`Unable to setup /session connection, invalid session id: ${sessionId}`);
        }

        ws.on('message', async (message) => {
            // Only handles /hook/{session-id} msg
            if (!pathname.startsWith('/hook/')) {
                Logger.error('Handing ws msg, ignoring ws msg with path:', pathname);
                return;
            }

            // Extract session id
            const sessionPathSegments = pathname.split('/');
            if (sessionPathSegments.length !== 3) {
                Logger.error('Not able to handle /hook ws msg, invalid path', pathname);
                return;
            }
            const sessionId = sessionPathSegments[2];

            // Parse msg
            const parsedMsg = JSON.parse(message.toString());
            let clientId = parsedMsg.options.customizedFields.clientId;
            if (!clientId) clientId = DEFAULT_CLIENT_ID;

            // Get ws instance
            const feWs = SessionManager.getSessionWs(sessionId, clientId);
            console.log(`Received sessionWs with session ${sessionId}, client ${clientId}`);
            if (!feWs) {
                Logger.error('Unable to process /hook ws msg, no fe ws instance found for session:', sessionId);
                return;
            }

            // Send msg
            const messageId = parsedMsg.messageId as string;
            const delta = parsedMsg.input.delta as string;
            if (!messageId) Logger.error('Unable to process /hook ws msg, invalid message:', parsedMsg);
            feWs.send(JSON.stringify({ type: 'stream', id: messageId, delta } as FeWsMessage));

            // Msg count
            if (!processedMsgs.isItemExist(messageId)) {
                SessionManager.updateSessionMsgCount(sessionId, 1).catch(e => Logger.error(`Unable to increase msg count for session ${sessionId}`, e));
                processedMsgs.push(messageId);
            }
        });

        ws.on('close', async () => {
            Logger.info(`Ws connection is closing: ${pathname}`);
        });

        ws.on('error', async (message) => {
            Logger.error('Captured ws error:', message);
        });
    }

    static handleStaticMsg(sessionId: string, messageId: string, content: string, contentType: 'text' | 'image', clientId?: string) {
        Logger.info(`Handling static msg, session:${sessionId}, msg: ${messageId}, content: ${content}`);

         // Get ws instance
         const feWs = SessionManager.getSessionWs(sessionId, clientId ?? DEFAULT_CLIENT_ID);
         if (!feWs) {
             Logger.error('Unable to process /hook static msg, no fe ws instance found for session:', sessionId);
             return;
         }

         // Send msg
         feWs.send(JSON.stringify({ type: 'static', id: messageId, content, contentType } as FeWsMessage), (e) => {
            Logger.info('Static ms sent, through fe ws. msg id:', messageId);
            if (e) Logger.error(`Error occured while sending static msg to fe ws: ${e}`);
         });

         // Msg count
         SessionManager.updateSessionMsgCount(sessionId, 1).catch(e => Logger.error(`Unable to increase msg count for session ${sessionId}`, e));
    }
}
