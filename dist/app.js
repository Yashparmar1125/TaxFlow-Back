"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_config_1 = __importDefault(require("./config/env.config"));
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const app = (0, express_1.default)();
// Set security HTTP headers
app.use((0, helmet_1.default)());
// Parse json request body
app.use(express_1.default.json());
// Parse urlencoded request body
app.use(express_1.default.urlencoded({ extended: true }));
// Enable CORS
app.use((0, cors_1.default)());
// HTTP request logger middleware for development
if (env_config_1.default.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// v1 API routes
app.use('/api/v1', routes_1.default);
// Base route for health check
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the API', status: 'OK' });
});
// Send 404 error for any unknown API request
app.use(error_middleware_1.notFoundHandler);
// Global error handler
app.use(error_middleware_1.errorHandler);
exports.default = app;
