"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const ApiError_1 = require("../utils/ApiError");
exports.userService = {
    async getProfile(userId) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                full_name: true,
                sub_type: true,
                pan_masked: true,
            }
        });
        if (!user)
            throw new ApiError_1.ApiError(404, 'User not found');
        return user;
    },
    async updateProfile(userId, data) {
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                full_name: true,
                sub_type: true,
                pan_masked: true,
            }
        });
        return user;
    },
    async setup(userId, data) {
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { sub_type: data.sub_type }
        });
        // Generate FY tasks placeholder logic
        const tasksCreatedCount = 5; // Placeholder
        return { tasks_created: tasksCreatedCount };
    },
    async updateFcmToken(userId, fcm_token) {
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { fcm_token }
        });
        return { success: true };
    }
};
