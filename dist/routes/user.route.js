"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const user_validator_1 = require("../validators/user.validator");
const router = (0, express_1.Router)();
// Protect all user routes
router.use(auth_middleware_1.authenticate);
router.get('/profile', user_controller_1.userController.getProfile);
router.put('/profile', (0, validate_middleware_1.validateRequest)(user_validator_1.updateProfileSchema), user_controller_1.userController.updateProfile);
router.post('/setup', (0, validate_middleware_1.validateRequest)(user_validator_1.setupUserSchema), user_controller_1.userController.setup);
router.put('/fcm-token', (0, validate_middleware_1.validateRequest)(user_validator_1.updateFcmTokenSchema), user_controller_1.userController.updateFcmToken);
exports.default = router;
