import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * Shared CORS Configuration
 * Dynamically builds allowed origins from process.env.CORS_ORIGINS
 * Supports wildcards like https://*.example.com converting them to Regex
 */
export const sharedCorsConfig: CorsOptions = {
  origin: (origin, callback) => {
    const envOrigins = process.env.CORS_ORIGINS?.split(',') || [];

    const allowedOrigins: string[] = [];
    const allowedOriginPatterns: RegExp[] = [];

    // Parse environment variables into static strings or regex patterns
    envOrigins.forEach((o) => {
      const trimmed = o.trim();
      if (trimmed.includes('*')) {
        // Convert wildcard string (e.g., https://*.flow.afronix.com) to Regex
        // Escapes dots and replaces * with .*
        const regexStr = '^' + trimmed.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
        allowedOriginPatterns.push(new RegExp(regexStr));
      } else {
        allowedOrigins.push(trimmed);
      }
    });

    // Default Development Fallbacks if Env is missing (Safety net)
    if (allowedOrigins.length === 0 && allowedOriginPatterns.length === 0) {
      allowedOrigins.push('http://localhost:4200');
    }

    // Allow requests with no origin (mobile apps, curl)
    if (!origin) return callback(null, true);

    // Check exact matches
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Check patterns
    if (allowedOriginPatterns.some((pattern) => pattern.test(origin))) return callback(null, true);

    console.error(`[CORS] Blocked Origin: ${origin}`);
    console.error(`[CORS] Allowed Origins: ${JSON.stringify(allowedOrigins)}`);
    console.error(`[CORS] Allowed Patterns: ${allowedOriginPatterns.map(p => p.toString())}`);

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
};
