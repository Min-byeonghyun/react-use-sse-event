"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  useSSE: () => useSSE
});
module.exports = __toCommonJS(index_exports);

// src/useSSE.ts
var import_react = require("react");
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
  const eventRef = (0, import_react.useRef)(null);
  const retryRef = (0, import_react.useRef)(retryDelay);
  const reconnectTimer = (0, import_react.useRef)(null);
  const listenersRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
  const [connected, setConnected] = (0, import_react.useState)(false);
  const [lastMessage, setLastMessage] = (0, import_react.useState)(null);
  const [messages, setMessages] = (0, import_react.useState)([]);
  const attach = (0, import_react.useCallback)(
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
  const connect = (0, import_react.useCallback)(() => {
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
  (0, import_react.useEffect)(() => {
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
  const subscribe = (0, import_react.useCallback)((cb) => {
    listenersRef.current.add(cb);
    return () => listenersRef.current.delete(cb);
  }, []);
  const close = (0, import_react.useCallback)(() => {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useSSE
});
//# sourceMappingURL=index.js.map