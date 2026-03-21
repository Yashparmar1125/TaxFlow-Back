"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.helmetConfig = void 0;
const helmet_1 = __importDefault(require("helmet"));
exports.helmetConfig = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    // Sets X-DNS-Prefetch-Control: off
    dnsPrefetchControl: { allow: false },
    // Sets X-Frame-Options: SAMEORIGIN
    frameguard: { action: 'sameorigin' },
    // Sets Strict-Transport-Security: max-age=15552000; includeSubDomains
    hsts: { maxAge: 15552000, includeSubDomains: true },
    // Sets X-Permitted-Cross-Domain-Policies: none
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
});
