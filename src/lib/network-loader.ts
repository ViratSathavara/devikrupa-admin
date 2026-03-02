type Listener = (pendingCount: number) => void;

let pendingRequests = 0;
const listeners = new Set<Listener>();

const emit = () => {
  for (const listener of listeners) {
    listener(pendingRequests);
  }
};

export const startNetworkRequest = () => {
  pendingRequests += 1;
  emit();
};

export const endNetworkRequest = () => {
  pendingRequests = Math.max(0, pendingRequests - 1);
  emit();
};

export const subscribeNetworkLoader = (listener: Listener) => {
  listeners.add(listener);
  listener(pendingRequests);
  return () => {
    listeners.delete(listener);
  };
};
