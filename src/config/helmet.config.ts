import helmet from 'helmet';

export const helmetConfig = helmet({
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
