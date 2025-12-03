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
  onOpen?: (ev: Event) => void;
  onError?: (err: Event | Error) => void;
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
    onOpen,
    onError,
  } = options || {};

  const eventRef = useRef<EventSource | null>(null); // EventSource 인스턴스
  const retryRef = useRef<number>(retryDelay); // 재시도 대기시간
  const reconnectTimer = useRef<number | null>(null); // 재연결 setTimeout id
  const listenersRef = useRef(new Set<(e: SSEEvent<T>) => void>()); // subscribe 콜백

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

      src.onmessage = (ev) => {
        const parsed: SSEEvent<T> = {
          id: (ev as any).lastEventId,
          event: ev.type,
          data: parseData(ev.data),
        };

        // 내부 상태 업데이트
        setLastMessage(parsed);
        setMessages((prev) => [...prev, parsed]);

        // listener 호출
        listenersRef.current.forEach((fn) => fn(parsed));
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

    const es = new EventSource(url, { withCredentials });
    eventRef.current = es;

    attach(es);
  }, [url, withCredentials, attach]);

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

  const subscribe = useCallback((cb: (e: SSEEvent<T>) => void) => {
    listenersRef.current.add(cb);
    return () => listenersRef.current.delete(cb);
  }, []);

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
    subscribe,
    close,
    reconnect: connect,
  };
}
