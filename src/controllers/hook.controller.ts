import {
    Controller,
    Post,
    Route,
    Body,
    Path
} from "tsoa";
import { Logger } from "../utils/logger.util";
import ConnectionManager from "../managers/connection.manager";

interface HookResponse {
    message: string
}

@Route("hook")
export class HookController extends Controller {

    @Post("/:sessionId")
    public async handleWebhook(@Body() body: any, @Path() sessionId: string): Promise<HookResponse> {
        try {
            ConnectionManager.handleStaticMsg(sessionId, body.messageId, body.input.value, body.input.type, body?.options?.customizedFields?.clientId);

            this.setStatus(200);
            return { message: "Response recorded" };
        } catch (e) {
            const errMsg = "Error processing webhook";
            Logger.error(errMsg, e);
            this.setStatus(500);
            return { message: errMsg };
        }
    }
}
