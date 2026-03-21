"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_config_1 = __importDefault(require("./config/env.config"));
const logger_1 = require("./utils/logger");
const PORT = env_config_1.default.PORT || 5000;
const server = app_1.default.listen(PORT, () => {
    logger_1.logger.info(`Server is running on port ${PORT}`);
    logger_1.logger.info(`Environment: ${env_config_1.default.NODE_ENV}`);
});
// Handle graceful shutdown
const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger_1.logger.info('Server closed');
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
};
const unexpectedErrorHandler = (error) => {
    logger_1.logger.error(error);
    exitHandler();
};
process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received');
    if (server) {
        server.close();
    }
});
