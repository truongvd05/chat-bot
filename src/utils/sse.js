// utils/sse.js
const clients = new Map(); // key -> Set<res>

export function addClient(key, res) {
  if (!clients.has(key)) {
    clients.set(key, new Set());
  }

  clients.get(key).add(res);

  res.on("close", () => {
    clients.get(key)?.delete(res);
    if (clients.get(key)?.size === 0) {
      clients.delete(key);
    }
  });
}

export function emit(key, payload) {
  const conns = clients.get(key);
  if (!conns) return;

  for (const res of conns) {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}
