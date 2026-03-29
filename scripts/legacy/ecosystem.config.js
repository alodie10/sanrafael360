module.exports = {
    apps: [
        {
            name: "sr360-backend",
            cwd: "./backend",
            script: "npm",
            args: "start",
            env: { NODE_ENV: "production", PORT: 1337 },
        },
        {
            name: "sr360-frontend",
            cwd: "./frontend",
            script: "node",
            args: ".next/standalone/server.js",
            env: { NODE_ENV: "production", PORT: 3000, HOSTNAME: "0.0.0.0" },
        },
    ],
};
