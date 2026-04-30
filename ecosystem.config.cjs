module.exports = {
    apps: [
        {
            name: "server",
            script: "server.js",
            watch: false,
        },
        {
            name: "queue",
            script: "queue.js",
            watch: false,
        },
        {
            name: "schedule",
            script: "schedule.js",
            watch: false,
        },
    ],
};
