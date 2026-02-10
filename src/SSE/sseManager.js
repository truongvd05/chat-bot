const clients = new Map();

export function addClient(conversationId, res) {
    if (!clients.has(conversationId)) {
        clients.set(conversationId, new Set());
    }
    clients.get(conversationId).add(res);

    res.on("close", () => {
        clients.get(conversationId)?.delete(res);
    });
}

export function emit(conversationId, data) {
    const subs = clients.get(conversationId);
    if (!subs) return;

    for (const res of subs) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
}
