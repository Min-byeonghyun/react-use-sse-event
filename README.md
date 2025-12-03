## 📌 react-use-sse-event

A tiny React hook for Server-Sent Events (SSE) with auto-reconnect, message parsing, and a simple subscribe API.

react-use-sse-event is a lightweight React hook that makes it easy to work with SSE (EventSource) in React.
It provides automatic reconnection, JSON parsing, and a subscribe API for multiple listeners, making it easy to handle real-time data in your components.

## ✨ Features

- 📡 Easily manage SSE connections (EventSource)

- 🔄 Automatic reconnection with exponential backoff

- 🧩 Subscribe to messages from multiple components

- 🔧 Automatic JSON parsing (string → object)

- 🍪 Supports cookies with withCredentials

- 🧹 Automatic cleanup on component unmount

## 📦 Installation

```bash
npm install react-use-sse-event
# or
yarn add react-use-sse-event
```

## 🚀 Basic Usage

A simple example:

```tsx
import React, { useEffect } from "react";
import { useSSE } from "react-use-sse-event";

export default function App() {
  const { connected, subscribe } = useSSE("https://example.com/sse");

  useEffect(() => {
    // Subscribe to messages
    const unsubscribe = subscribe((event) => {
      console.log("SSE message:", event);
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, [subscribe]);

  return (
    <div>Connection status: {connected ? "Connected" : "Disconnected"}</div>
  );
}
```

### ⚙️ Advanced Usage (with options)

```tsx
import { useSSE } from "react-use-sse-event";

const { connected, lastMessage, messages, subscribe, reconnect, close } =
  useSSE("https://example.com/sse", {
    withCredentials: true, // Include cookies
    retryDelay: 1000, // Initial reconnect delay (ms)
    maxRetryDelay: 30000, // Maximum reconnect delay (ms)
    onOpen: () => console.log("SSE Connected!"),
    onError: (err) => console.error("SSE Error:", err),
    getToken: () => Cookies.get("Authorization"), // Optional JWT token
  });
```

### 🛠 Options

| Option            | Type                            | Default     | Description                    |
| ----------------- | ------------------------------- | ----------- | ------------------------------ |
| `withCredentials` | `boolean`                       | `false`     | Include cookies in requests    |
| `retryDelay`      | `number`                        | `1000`      | Initial reconnect delay (ms)   |
| `maxRetryDelay`   | `number`                        | `30000`     | Maximum reconnect delay (ms)   |
| `onOpen`          | `(ev: Event) => void`           | `undefined` | Callback when connection opens |
| `onError`         | `(err: Event \| Error) => void` | `undefined` | Callback on error              |
| `getToken`        | `() => void`                    | `undefined` | Callback on error              |

### 📡 API

```ts
const {
  connected, // boolean: connection status
  lastMessage, // last received message
  messages, // all messages array (automatically accumulated)
  subscribe, // add listener for incoming messages
  close, // manually close the connection
  reconnect, // manually reconnect
} = useSSE(url, options);
```

### 🔔 subscribe(callback)

Allows multiple components to listen to SSE messages.

Returns an unsubscribe function:

```tsx
const unsubscribe = subscribe((event) => {
  console.log(event.data);
});

unsubscribe(); // stop listening
```

### 🧼 Automatic Cleanup

The hook automatically closes the EventSource and clears timers when the component unmounts.
No need to worry about memory leaks.

```
"{\"name\":\"hong gildong\"}"
```

The hook automatically parses it to a JavaScript object:

```
{ name: "hong gildong" }
```

This allows you to directly access object properties in React components.
