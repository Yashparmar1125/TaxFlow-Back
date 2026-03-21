"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = __importDefault(require("../config/env.config"));
const generateToken = (userId, type) => {
    const expiresIn = type === 'access' ? '15m' : '30d';
    const payload = {
        sub: userId,
        type,
        // Add roles or user_type if needed for middleware RBAC
    };
    return jsonwebtoken_1.default.sign(payload, env_config_1.default.JWT_SECRET, { expiresIn });
};
exports.generateToken = generateToken;
const verifyToken = (token, requiredType) => {
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_config_1.default.JWT_SECRET);
        if (payload.type !== requiredType) {
            throw new Error('Invalid token type');
        }
        return payload;
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
