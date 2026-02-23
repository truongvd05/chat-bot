function formatChatItem(conversation, meId) {
    const lastMessage = conversation.messages[0] || null;

    if (conversation.type === "DIRECT") {
        const other = conversation.participants[0]?.user;

        return {
            id: conversation.id,
            type: "DIRECT",
            title: other?.name ?? "Unknown",
            avatar: other?.avatar ?? null,
            lastMessage,
        };
    }

    // GROUP
    return {
        id: conversation.id,
        type: "GROUP",
        title: conversation.title,
        avatar: conversation.avatar ?? null,
        lastMessage,
    };
}

export default formatChatItem;
