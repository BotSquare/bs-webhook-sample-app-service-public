import WebSocket from 'ws';
import { BotInfo, WHConfig } from '../types/data.type';
import { Logger } from '../utils/logger.util';
import { createSession, updateSession, getSession, isSessionExist, updateSessionMsgCount, getInfo } from '../services/session.service';

const sessionToWs: Map<string,Map<string, WebSocket>> = new Map();

export default class SessionManager {

    static async createSession(): Promise<string> {
        const sessionId = await createSession();

        Logger.info(`Created session ${sessionId}`);
        return sessionId;
    }

    static async updateSessionWithWHConfig(sessionId: string, whConfig: WHConfig): Promise<boolean> {
        Logger.info(`Updated session ${sessionId}`);
        await updateSession(sessionId, whConfig)
        return true;
    }

    static async getSession(sessionId: string): Promise<WHConfig | null> {
        Logger.info(`Getting session ${sessionId}`);
        const whConfig = await getSession(sessionId);
        if (!whConfig) {
            Logger.error(`Getting session failed, session invalid ${sessionId}`);
            return null;
        }
        
        return whConfig;
    }

    static async updateSessionWithWS(sessionId: string, clientId: string, ws: WebSocket): Promise<boolean> {
        const sessionExist = await isSessionExist(sessionId);
        if (!sessionExist) {
            Logger.error('Unable to update session with ws, invalid session id');
            return false
        }

        const wsMap = sessionToWs.get(sessionId);
        if (wsMap) {
            wsMap.set(clientId, ws);
        } else {
            const newWsMap = new Map();
            newWsMap.set(clientId, ws);
            sessionToWs.set(sessionId, newWsMap);
        }
        Logger.info(`Updated session ${sessionId} with ws`);
        return true;
    }

    static getSessionWs(sessionId: string, clientId: string): WebSocket | null {
        Logger.info(`Getting ws for session ${sessionId}, client ${clientId}`);

        const wsMap = sessionToWs.get(sessionId);
        if (!wsMap) {
            Logger.error('Unable to get session ws map with session Id, invalid ws session');
            return null;
        }

        const ws = wsMap.get(clientId);
        if (!ws) {
            Logger.error('Unable to get session ws with client Id, invalid ws session');
            return null;
        }

        return ws;
    }

    static async isSessionExist(sessionId: string): Promise<boolean> {
        return await isSessionExist(sessionId);
    }

    static async updateSessionMsgCount(sessionId: string, increment: number): Promise<boolean> {
        Logger.info(`Updating session ${sessionId} msg count by ${increment}`);
        return await updateSessionMsgCount(sessionId, increment);
    }

    static async getInfo(bearerToken: string): Promise<BotInfo | null> {
        Logger.info(`Getting info`);
        const botInfo = await getInfo(bearerToken);
        if (!botInfo) {
            Logger.error(`Getting info failed ${bearerToken}`);
            return null;
        }
        
        return botInfo;
    }
}