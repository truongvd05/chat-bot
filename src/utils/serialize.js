export function serializeBigInt(data) {
    if (data === null || data === undefined) return data;
    return JSON.parse(
        JSON.stringify(data, (_, value) =>
            typeof value === "bigint" ? value.toString() : value,
        ),
    );
}
