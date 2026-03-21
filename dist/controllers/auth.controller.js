"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("../services/auth.service");
const jwt_1 = require("../utils/jwt");
const ApiError_1 = require("../utils/ApiError");
exports.authController = {
    async register(req, res, next) {
        try {
            const result = await auth_service_1.authService.register(req.body);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async login(req, res, next) {
        try {
            const result = await auth_service_1.authService.login(req.body);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async googleAuth(req, res, next) {
        try {
            const result = await auth_service_1.authService.googleAuth(req.body);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async refreshToken(req, res, next) {
        try {
            const { refresh_token } = req.body;
            const decoded = (0, jwt_1.verifyToken)(refresh_token, 'refresh');
            if (!decoded) {
                throw new ApiError_1.ApiError(401, 'Invalid or expired refresh token');
            }
            const result = await auth_service_1.authService.refreshToken({ userId: decoded.sub });
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async logout(req, res, next) {
        try {
            const { refresh_token } = req.body;
            if (!refresh_token)
                throw new ApiError_1.ApiError(400, 'refresh_token is required');
            await auth_service_1.authService.logout(refresh_token);
            res.status(200).json({ success: true });
        }
        catch (error) {
            next(error);
        }
    },
    async forgotPassword(req, res, next) {
        try {
            await auth_service_1.authService.requestPasswordReset(req.body);
            res.status(200).json({ message: 'Email sent' });
        }
        catch (error) {
            next(error);
        }
    },
    async resetPassword(req, res, next) {
        try {
            await auth_service_1.authService.resetPassword(req.body);
            res.status(200).json({ success: true });
        }
        catch (error) {
            next(error);
        }
    }
};
