type SSEEvent<T = any> = {
    id?: string;
    event?: string;
    data: T;
};
type UseSSEOptions = {
    withCredentials?: boolean;
    retryDelay?: number;
    maxRetryDelay?: number;
    onOpen?: (ev: Event) => void;
    onError?: (err: Event | Error) => void;
};
declare function useSSE<T = any>(url: string | null, options?: UseSSEOptions): {
    connected: boolean;
    lastMessage: SSEEvent<T> | null;
    messages: SSEEvent<T>[];
    subscribe: (cb: (e: SSEEvent<T>) => void) => () => boolean;
    close: () => void;
    reconnect: () => void;
};

export { type SSEEvent, type UseSSEOptions, useSSE };
