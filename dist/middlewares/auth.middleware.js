"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const ApiError_1 = require("../utils/ApiError");
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError_1.ApiError(401, 'Unauthorized');
        }
        const token = authHeader.split(' ')[1];
        const payload = (0, jwt_1.verifyToken)(token, 'access');
        if (!payload) {
            throw new ApiError_1.ApiError(401, 'Invalid or expired token');
        }
        req.user = payload;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
