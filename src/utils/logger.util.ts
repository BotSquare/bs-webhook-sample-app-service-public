import WebSocket from 'ws';

export class Logger {
    static info(msg: string, extra?: any) {
        console.log(`ℹ️ ${msg}`, ...(extra !== undefined ? [extra] : []));
    }

    static error(msg: string, extra?: any) {
        console.error(`❌ ${msg}`, ...(extra !== undefined ? [extra] : []));
    }
}

export class WSTools {
    static safelyCloseWebSocket(ws: WebSocket): void {
        Logger.info(`Closing WebSocket connection ${ws.url}`);

        switch (ws.readyState) {
          case WebSocket.OPEN:
            Logger.info('Closing the WebSocket connection...');
            ws.close();
            break;
          case WebSocket.CONNECTING:
            Logger.info('WebSocket is connecting. Will close once opened...');
            ws.once('open', () => ws.close());
            break;
          case WebSocket.CLOSING:
            Logger.info('WebSocket is already closing.');
            break;
          case WebSocket.CLOSED:
            Logger.info('WebSocket is already closed.');
            break;
          default:
            Logger.error('Unrecognized WebSocket state:', ws.readyState);
        }
      }
}