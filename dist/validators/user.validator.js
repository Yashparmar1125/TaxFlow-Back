"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFcmTokenSchema = exports.setupUserSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        full_name: zod_1.z.string().min(2).optional(),
        pan_masked: zod_1.z.string().length(10, 'PAN must be 10 characters').optional(),
        sub_type: zod_1.z.enum(['salaried', 'freelancer', 'professional']).optional(),
    }).strict(),
});
exports.setupUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        sub_type: zod_1.z.enum(['salaried', 'freelancer', 'professional']),
    }).strict(),
});
exports.updateFcmTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        fcm_token: zod_1.z.string().min(1, 'FCM token is required'),
    }).strict(),
});
