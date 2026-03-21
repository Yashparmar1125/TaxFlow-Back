"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshTokenSchema = exports.googleAuthSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
        full_name: zod_1.z.string().min(2, 'Full name is required'),
    }).strict(),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(1, 'Password is required'),
    }).strict(),
});
exports.googleAuthSchema = zod_1.z.object({
    body: zod_1.z.object({
        id_token: zod_1.z.string().nonempty('id_token is required'),
    }).strict(),
});
exports.refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refresh_token: zod_1.z.string().nonempty('refresh_token is required'),
    }).strict(),
});
exports.forgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Valid email is required'),
    }).strict(),
});
exports.resetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().nonempty('Reset token is required'),
        new_password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    }).strict(),
});
