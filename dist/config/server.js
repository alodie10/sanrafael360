"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = ({ env }) => ({
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '1337', 10),
    url: process.env.PUBLIC_URL || 'https://api.sanrafael360.com',
    app: {
        keys: env.array('APP_KEYS'),
    },
});
exports.default = config;
