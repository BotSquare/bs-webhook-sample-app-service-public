import {
    Controller,
    Post,
    Put,
    Route,
    Body,
    Path,
    Get
} from "tsoa";
import SessionManager from "../managers/session.manager";
import { Logger } from '../utils/logger.util';
import { WebhookInfoResponse, WHConfig } from '../types/data.type';

interface SessionResponse {
    message: string
    sessionId: string
    apiUrl?: string
    bearerToken?: string
}

interface SessionErrorResponse {
    message: string
}

@Route("session")
export class SessionController extends Controller {
    @Post("/")
    public async createSession(): Promise<SessionResponse | SessionErrorResponse> {
        try {
            const sessionId = await SessionManager.createSession()

            this.setStatus(200);
            return { message: "Session created", sessionId };
        } catch (e) {
            const errMsg = "Error creating session";
            Logger.error(errMsg, e);
            this.setStatus(500);
            return { message: errMsg };
        } 
    }

    @Put("/:sessionId")
    public async updateSession(@Body() body: WHConfig, @Path() sessionId: string): Promise<SessionResponse | SessionErrorResponse> {
        try {
            await SessionManager.updateSessionWithWHConfig(sessionId, body);
            this.setStatus(200);
            return { message: "Session updated", sessionId };
        } catch (e) {
            const errMsg = "Error updating session";
            Logger.error(errMsg, e);
            this.setStatus(500);
            return { message: errMsg };
        } 
    }

    @Get("/:sessionId")
    public async getSession(@Path() sessionId: string): Promise<SessionResponse | SessionErrorResponse> {
        try {
            const { apiUrl, bearerToken } = await SessionManager.getSession(sessionId);
            if (!apiUrl || !bearerToken) throw new Error(`Getting session ${sessionId} failed, invalid session`);

            this.setStatus(200);
            return { message: "Session updated", sessionId, apiUrl, bearerToken };
        } catch (e) {
            const errMsg = "Error getting session";
            Logger.error(errMsg, e);
            this.setStatus(500);
            return { message: errMsg };
        } 
    }

    @Get("/:sessionId/info")
    public async getInfo(@Path() sessionId: string): Promise<WebhookInfoResponse | SessionErrorResponse> {
        try {
            const { apiUrl, bearerToken } = await SessionManager.getSession(sessionId);
            if (!apiUrl || !bearerToken) throw new Error(`Getting session ${sessionId} failed, invalid session`);

            const botInfo = await SessionManager.getInfo(bearerToken);
            if (!botInfo) throw new Error(`Getting info failed`);

            this.setStatus(200);
            return { 
                message: "success", 
                payload: {
                    bot: botInfo
                } 
            }
        } catch (e) {
            const errMsg = "Error getting info";
            Logger.error(errMsg, e);
            this.setStatus(500);
            return { message: errMsg };
        }
    }
}
