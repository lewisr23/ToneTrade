import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = 'http://localhost:8080/ws';

/**
 * One STOMP client per open chat. Auth happens on the CONNECT frame (the JWT
 * goes in a native STOMP header, not a query string) — see
 * StompAuthChannelInterceptor on the backend.
 */
export function createChatClient(token: string): Client {
  return new Client({
    webSocketFactory: () => new SockJS(WS_URL) as any,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 4000,
  });
}
