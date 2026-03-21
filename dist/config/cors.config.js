"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsConfig = void 0;
const env_config_1 = __importDefault(require("./env.config"));
exports.corsConfig = {
    origin: (origin, callback) => {
        // If ALLOWED_ORIGINS is set to *, allow all. 
        // Otherwise, check if origin is in the allowed list or if it's undefined (e.g. server-to-server or Postman).
        if (env_config_1.default.ALLOWED_ORIGINS === '*') {
            return callback(null, true);
        }
        const allowedOrigins = env_config_1.default.ALLOWED_ORIGINS.split(',').map(o => o.trim());
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
