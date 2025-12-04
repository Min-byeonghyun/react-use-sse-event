import { EventSourcePolyfill } from "event-source-polyfill";
import { useEffect, useRef, useState, useCallback } from "react";

export type SSEEvent<T = any> = {
  id?: string;
  event?: string;
  data: T; // data는 항상 파싱된 상태로 전달됨
};

export type UseSSEOptions = {
  withCredentials?: boolean;
  retryDelay?: number;
  maxRetryDelay?: number;
  maxMessages?: number;
  onOpen?: (ev: Event) => void;
  onError?: (err: Event | Error) => void;
  getHeaders?: () => Record<string, string>;
};

// JSON 자동 파서

function parseData(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    return raw; // JSON이 아니면 문자열 그대로
  }
}

export function useSSE<T = any>(url: string | null, options?: UseSSEOptions) {
  const {
    withCredentials = false,
    retryDelay = 1000,
    maxRetryDelay = 30000,
    maxMessages = 100,
    onOpen,
    onError,
  } = options || {};

  const eventRef = useRef<EventSource | null>(null); // EventSource 인스턴스
  const retryRef = useRef<number>(retryDelay); // 재시도 대기시간
  const reconnectTimer = useRef<number | null>(null); // 재연결 setTimeout id
  const listenersRef = useRef(
    new Map<
      string,
      {
        callbacks: Set<(e: SSEEvent<T>) => void>;
        handler: (ev: MessageEvent) => void;
      }
    >()
  ); // subscribe 콜백

  const [connected, setConnected] = useState(false); // 연결 상태 UI
  const [lastMessage, setLastMessage] = useState<SSEEvent<T> | null>(null); // 마지막 수신 이벤트
  const [messages, setMessages] = useState<SSEEvent<T>[]>([]); // 누적 메세지

  const attach = useCallback(
    (src: EventSource) => {
      src.onopen = (ev) => {
        retryRef.current = retryDelay; // 재시도 대기 시간 리셋
        setConnected(true); // 연결상태 True
        onOpen?.(ev); // onOpen 옵션
      };

      src.onerror = (ev) => {
        setConnected(false); // 연결이 끊기면 연결상태 false 처리
        onError?.(ev); // onError 옵션

        if (!reconnectTimer.current) {
          reconnectTimer.current = window.setTimeout(() => {
            reconnectTimer.current = null;

            const es = eventRef.current;
            if (!es || es.readyState === EventSource.CLOSED) {
              connect();
            }
          }, retryRef.current);

          retryRef.current = Math.min(retryRef.current * 2, maxRetryDelay);
        }
      };
    },
    [onOpen, onError, retryDelay, maxRetryDelay]
  );

  const connect = useCallback(() => {
    if (!url) return;

    if (eventRef.current) {
      try {
        eventRef.current.close();
      } catch {}
    }
    const headers = options?.getHeaders?.() ?? {};

    const es = new EventSourcePolyfill(url, { withCredentials, headers });

    eventRef.current = es;

    attach(es);
    registerEventListener("message");
  }, [url, withCredentials, attach]);

  const registerEventListener = useCallback(
    (eventName: string) => {
      if (!eventRef.current) return;

      // 재등록 X
      if (listenersRef.current.has(eventName)) return;

      const handler = (ev: MessageEvent) => {
        const parsed: SSEEvent<T> = {
          id: (ev as any).lastEventId,
          event: eventName,
          data: parseData(ev.data),
        };

        setLastMessage(parsed);
        setMessages((prev) => {
          const newMessages = [...prev, parsed];
          // maxMessages 제한
          if (newMessages.length > maxMessages) {
            newMessages.splice(0, newMessages.length - maxMessages);
          }
          return newMessages;
        });

        const listeners = listenersRef.current.get(eventName)?.callbacks;
        if (listeners) listeners.forEach((fn) => fn(parsed));
      };

      listenersRef.current.set(eventName, { callbacks: new Set(), handler });
      eventRef.current.addEventListener(eventName, handler);
    },
    [maxMessages]
  );

  // URL 변경 시 연결

  useEffect(() => {
    if (!url) return;

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (eventRef.current) {
        try {
          eventRef.current.close();
        } catch {}
        eventRef.current = null;
      }
    };
  }, [url, connect]);

  const subscribe = useCallback(
    (eventName: string, cb: (e: SSEEvent<T>) => void) => {
      if (!listenersRef.current.has(eventName)) {
        registerEventListener(eventName);
      }

      const entry = listenersRef.current.get(eventName)!;
      entry.callbacks.add(cb);

      // 구독 해제 시 Set에서 제거, Set이 비어있으면 EventSource handler 제거
      return () => {
        entry.callbacks.delete(cb);
        if (entry.callbacks.size === 0) {
          eventRef.current?.removeEventListener(eventName, entry.handler);
          listenersRef.current.delete(eventName);
        }
      };
    },
    [registerEventListener]
  );

  const close = useCallback(() => {
    if (eventRef.current) {
      try {
        eventRef.current.close();
      } catch {}
      eventRef.current = null;
      setConnected(false);
    }

    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, []);

  return {
    connected,
    lastMessage, // 마지막 메시지
    messages, // 모든 메시지 배열 (자동 누적)
    subscribe, // 이벤트별 구독
    close,
    reconnect: connect,
  };
}
