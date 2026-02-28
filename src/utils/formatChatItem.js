function formatChatItem(conversation, meId) {
    const lastMessage = conversation.messages[0] || null;

    if (conversation.type === "DIRECT") {
        const other = conversation.participants[0]?.user;

        return {
            id: conversation.id,
            type: "DIRECT",
            title: conversation.title,
            lastMessage,
        };
    }

    // GROUP
    return {
        id: conversation.id,
        type: "GROUP",
        title: conversation.title,
        lastMessage,
    };
}

export default formatChatItem;
