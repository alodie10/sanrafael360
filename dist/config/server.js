"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = ({ env }) => ({
    host: process.env.HOST || '0.0.0.0',
    port: (process.env.PORT || 1337),
    url: 'https://api.sanrafael360.com',
    app: {
        keys: env.array('APP_KEYS'),
    },
});
exports.default = config;
