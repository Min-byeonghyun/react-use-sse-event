# 📡 react-use-sse-event

A lightweight React hook for **Server-Sent Events (SSE)** with automatic reconnection, JSON parsing, and a simple subscribe API.  
Perfect for handling real-time data in React components.

---

## ✨ Features

- 🔹 Manage SSE connections easily (`EventSource`)
- 🔄 Automatic reconnection with exponential backoff
- 🧩 Subscribe to multiple events with multiple listeners
- 🔧 Automatic JSON parsing (`string` → `object`)
- 🍪 Supports cookies with `withCredentials`
- 🧹 Automatic cleanup on component unmount
- 📝 Option to limit stored messages (`maxMessages`)

---

## 📦 Installation

```bash
npm install react-use-sse-event
# or
yarn add react-use-sse-event
```

## 🚀 Basic Usage

```tsx
import React, { useEffect } from "react";
import { useSSE } from "react-use-sse-event";

type BidType = {
  bidder: string;
  bidPrice: number;
  createDate: string;
};

export default function App() {
  const { connected, messages, subscribe } = useSSE<BidType>(
    "https://example.com/sse"
  );

  useEffect(() => {
    // Subscribe to a custom event "addBid"
    const unsubscribe = subscribe("addBid", (event) => {
      console.log("Bid:", event.data);
    });

    return () => unsubscribe();
  }, [subscribe]);

  return (
    <div>
      Connection status: {connected ? "Connected" : "Disconnected"}
      <div>
        Received bids:
        {messages.map((msg, idx) => (
          <pre key={idx}>
            Bidder: {msg.data.bidder}, Price: {msg.data.bidPrice}
          </pre>
        ))}
      </div>
    </div>
  );
}
```

## ⚙️ Advanced Usage (with options)

```tsx
import { useSSE } from "react-use-sse-event";
import Cookies from "js-cookie";

const { connected, lastMessage, messages, subscribe, reconnect, close } =
  useSSE("https://example.com/sse", {
    withCredentials: true, // include cookies
    retryDelay: 1000, // initial reconnect delay (ms)
    maxRetryDelay: 30000, // maximum reconnect delay (ms)
    maxMessages: 100, // store only last 100 messages
    onOpen: () => console.log("SSE Connected!"),
    onError: (err) => console.error("SSE Error:", err),
    getHeaders: () => ({
      Authorization: `Bearer ${Cookies.get("Authorization")}`,
    }),
  });
```

### 🛠 Options

| Option            | Type                            | Default     | Description                            |
| ----------------- | ------------------------------- | ----------- | -------------------------------------- |
| `withCredentials` | `boolean`                       | `false`     | Include cookies in requests            |
| `retryDelay`      | `number`                        | `1000`      | Initial reconnect delay (ms)           |
| `maxRetryDelay`   | `number`                        | `30000`     | Maximum reconnect delay (ms)           |
| `maxMessages`     | `number`                        | `Infinity`  | Maximum number of messages to keep     |
| `onOpen`          | `(ev: Event) => void`           | `undefined` | Callback when connection opens         |
| `onError`         | `(err: Event \| Error) => void` | `undefined` | Callback on error                      |
| `getHeaders`      | `() => Record<string, string>`  | `undefined` | Optional headers (e.g., Authorization) |

### 📡 API

```ts
const {
  connected, // boolean: connection status
  lastMessage, // last received message
  messages, // all messages (automatically accumulated)
  subscribe, // add listener for a specific event
  close, // manually close the connection
  reconnect, // manually reconnect
} = useSSE(url, options);
```

### 🔔 subscribe(eventName, callback)

- Allows multiple components to listen to SSE messages.
- Returns an unsubscribe function.

```ts
const unsubscribe = subscribe("addBid", (event) => {
  console.log(event.data);
});

unsubscribe(); // stop listening
```

### 🧼 Automatic Cleanup

- The hook automatically closes the EventSource and clears timers on component unmount.
- No need to worry about memory leaks.

### 🔧 JSON Parsing

The hook automatically parses incoming JSON strings:

```ts
// Server sends:
"{\"name\":\"hong gildong\"}";

// useSSE parses it automatically:
{
  name: "hong gildong";
}
```

### 📌 Summary

react-use-sse-event is perfect for:

- Real-time dashboards

- Live bidding apps

- Chat apps

- Notifications

- Any use case requiring SSE in React
