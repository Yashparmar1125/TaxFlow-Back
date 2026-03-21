"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const ApiError_1 = require("../utils/ApiError");
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errorMessages = error.errors.map((issue) => ({
                    message: `${issue.path.join('.')} is ${issue.message}`,
                }));
                return res.status(400).json({ success: false, errors: errorMessages });
            }
            return next(new ApiError_1.ApiError(500, 'Internal Server Error'));
        }
    };
};
exports.validateRequest = validateRequest;
