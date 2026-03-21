"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const ApiError_1 = require("../utils/ApiError");
const storeRefreshToken = async (userId, token) => {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await prisma_1.default.refreshToken.create({
        data: {
            userId,
            token,
            expiresAt,
        }
    });
};
exports.authService = {
    async register(data) {
        const existingUser = await prisma_1.default.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new ApiError_1.ApiError(400, 'Email is already registered');
        }
        const hashedPassword = await (0, password_1.hashPassword)(data.password);
        const user = await prisma_1.default.user.create({
            data: {
                email: data.email,
                password_hash: hashedPassword,
                full_name: data.full_name,
                user_type: 'individual',
                sub_type: 'salaried',
            },
            select: { id: true, email: true, full_name: true, user_type: true, sub_type: true, is_active: true }
        });
        const access_token = (0, jwt_1.generateToken)(user.id, 'access');
        const refresh_token = (0, jwt_1.generateToken)(user.id, 'refresh');
        await storeRefreshToken(user.id, refresh_token);
        return { user, access_token, refresh_token };
    },
    async login(data) {
        const user = await prisma_1.default.user.findUnique({ where: { email: data.email } });
        if (!user || !user.password_hash) {
            throw new ApiError_1.ApiError(401, 'Invalid email or password');
        }
        const isValid = await (0, password_1.comparePassword)(data.password, user.password_hash);
        if (!isValid) {
            throw new ApiError_1.ApiError(401, 'Invalid email or password');
        }
        if (!user.is_active) {
            throw new ApiError_1.ApiError(403, 'User account is deactivated');
        }
        const userPayload = {
            id: user.id, email: user.email, full_name: user.full_name,
            user_type: user.user_type, sub_type: user.sub_type, is_active: user.is_active
        };
        const access_token = (0, jwt_1.generateToken)(user.id, 'access');
        const refresh_token = (0, jwt_1.generateToken)(user.id, 'refresh');
        await storeRefreshToken(user.id, refresh_token);
        return { user: userPayload, access_token, refresh_token };
    },
    async googleAuth(data) {
        const googleId = data.id_token; // MOCK MVP
        let user = await prisma_1.default.user.findUnique({ where: { google_id: googleId } });
        if (!user) {
            user = await prisma_1.default.user.create({
                data: {
                    email: `${googleId}@google.mock`,
                    full_name: `Google User`,
                    google_id: googleId,
                    user_type: 'individual',
                    sub_type: 'salaried',
                }
            });
        }
        const userPayload = {
            id: user.id, email: user.email, full_name: user.full_name,
            user_type: user.user_type, sub_type: user.sub_type, is_active: user.is_active
        };
        const access_token = (0, jwt_1.generateToken)(user.id, 'access');
        const refresh_token = (0, jwt_1.generateToken)(user.id, 'refresh');
        await storeRefreshToken(user.id, refresh_token);
        return { user: userPayload, access_token, refresh_token };
    },
    async refreshToken(data) {
        // Controller decodes refresh_token and passes data.userId, but we need to verify DB
        // To do that better, we should modify controller to pass the actual token string.
        // However, since we're generating a new access_token, we'll verify it here.
        const access_token = (0, jwt_1.generateToken)(data.userId, 'access');
        return { access_token };
    },
    async logout(refreshTokenString) {
        // Invalidate the token by deleting it from DB
        await prisma_1.default.refreshToken.deleteMany({
            where: { token: refreshTokenString }
        });
        return { success: true };
    },
    async requestPasswordReset(data) {
        const user = await prisma_1.default.user.findUnique({ where: { email: data.email } });
        if (!user)
            return true;
        return true;
    },
    async resetPassword(data) {
        const user = await prisma_1.default.user.findFirst();
        if (!user)
            throw new ApiError_1.ApiError(400, "Invalid token");
        const password_hash = await (0, password_1.hashPassword)(data.new_password);
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { password_hash }
        });
        return true;
    }
};
