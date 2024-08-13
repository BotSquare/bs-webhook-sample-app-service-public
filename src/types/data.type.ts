export type WHConfig = {
    apiUrl: string
    bearerToken: string
}

export interface WebhookInfoResponse {
    message: string,
    payload:  {
        bot: BotInfo
    }
}

export interface BotInfo {
    name: string,
    icon: string,
    description?: string
}