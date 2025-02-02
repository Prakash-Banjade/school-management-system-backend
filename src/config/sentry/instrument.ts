require('dotenv').config();
import * as Sentry from "@sentry/nestjs"
import { nodeProfilingIntegration } from "@sentry/profiling-node";

process.env.NODE_ENV === 'production' && Sentry.init({
    dsn: process.env.SENTRY_DSN!,
    environment: process.env.NODE_ENV,
    integrations: [
        nodeProfilingIntegration(),
    ],

    tracesSampleRate: 1.0,

    profilesSampleRate: 1.0,
});