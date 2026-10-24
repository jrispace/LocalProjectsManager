// Multi-tab sync using BroadcastChannel
const CHANNEL_NAME = "lpm-sync";

let channel: BroadcastChannel | null = null;
let listeners: Set<() => void> = new Set();

export function initTabSync(onSync: () => void): () => void {
  if (typeof BroadcastChannel === "undefined") return () => {};

  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }

  const handler = () => {
    onSync();
  };

  channel.addEventListener("message", handler);
  listeners.add(handler);

  return () => {
    channel?.removeEventListener("message", handler);
    listeners.delete(handler);
    if (listeners.size === 0 && channel) {
      channel.close();
      channel = null;
    }
  };
}

export function notifyOtherTabs(event: string = "update"): void {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  channel.postMessage({ event, timestamp: Date.now() });
}

export function cleanupTabSync(): void {
  if (channel) {
    channel.close();
    channel = null;
  }
  listeners.clear();
}
