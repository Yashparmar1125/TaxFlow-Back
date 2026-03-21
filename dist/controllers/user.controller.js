"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const user_service_1 = require("../services/user.service");
exports.userController = {
    async getProfile(req, res, next) {
        try {
            const userId = req.user.sub; // injected by auth.middleware
            const profile = await user_service_1.userService.getProfile(userId);
            res.status(200).json(profile);
        }
        catch (error) {
            next(error);
        }
    },
    async updateProfile(req, res, next) {
        try {
            const userId = req.user.sub;
            const updatedProfile = await user_service_1.userService.updateProfile(userId, req.body);
            res.status(200).json(updatedProfile);
        }
        catch (error) {
            next(error);
        }
    },
    async setup(req, res, next) {
        try {
            const userId = req.user.sub;
            const result = await user_service_1.userService.setup(userId, req.body);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async updateFcmToken(req, res, next) {
        try {
            const userId = req.user.sub;
            const result = await user_service_1.userService.updateFcmToken(userId, req.body.fcm_token);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
};
