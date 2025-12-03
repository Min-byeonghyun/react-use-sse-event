// src/useSSE.ts
import { useEffect, useRef, useState, useCallback } from "react";
function parseData(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
function useSSE(url, options) {
  const {
    withCredentials = false,
    retryDelay = 1e3,
    maxRetryDelay = 3e4,
    onOpen,
    onError
  } = options || {};
  const eventRef = useRef(null);
  const retryRef = useRef(retryDelay);
  const reconnectTimer = useRef(null);
  const listenersRef = useRef(/* @__PURE__ */ new Set());
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const attach = useCallback(
    (src) => {
      src.onopen = (ev) => {
        retryRef.current = retryDelay;
        setConnected(true);
        onOpen?.(ev);
      };
      src.onerror = (ev) => {
        setConnected(false);
        onError?.(ev);
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
        const parsed = {
          id: ev.lastEventId,
          event: ev.type,
          data: parseData(ev.data)
        };
        setLastMessage(parsed);
        setMessages((prev) => [...prev, parsed]);
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
      } catch {
      }
    }
    const es = new EventSource(url, { withCredentials });
    eventRef.current = es;
    attach(es);
  }, [url, withCredentials, attach]);
  useEffect(() => {
    if (!url) return;
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (eventRef.current) {
        try {
          eventRef.current.close();
        } catch {
        }
        eventRef.current = null;
      }
    };
  }, [url, connect]);
  const subscribe = useCallback((cb) => {
    listenersRef.current.add(cb);
    return () => listenersRef.current.delete(cb);
  }, []);
  const close = useCallback(() => {
    if (eventRef.current) {
      try {
        eventRef.current.close();
      } catch {
      }
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
    lastMessage,
    // 마지막 메시지
    messages,
    // 모든 메시지 배열 (자동 누적)
    subscribe,
    close,
    reconnect: connect
  };
}
export {
  useSSE
};
//# sourceMappingURL=index.mjs.map