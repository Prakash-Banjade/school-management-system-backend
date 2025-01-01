import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { setupSwagger } from './config/swagger.config';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import fastifyCookie from '@fastify/cookie';
import { ConfigService } from '@nestjs/config';
import fastifyHelmet from '@fastify/helmet';
import fastifyCsrfProtection from '@fastify/csrf-protection';
import fastifyCors from '@fastify/cors';
import multipart from '@fastify/multipart';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({}),
    {
      logger: ['error', 'warn', 'debug', 'verbose',],
    }
  );

  const configService = app.get(ConfigService);

  app.register(fastifyCookie, {
    secret: configService.get<string>('COOKIE_SECRET'),
  });

  configService.get('NODE_ENV') === 'production' && app.register(fastifyHelmet);
  app.register(fastifyCsrfProtection, { cookieOpts: { signed: true } });
  app.register(multipart);

  app.register(fastifyCors, {
    credentials: true,
    origin: (origin, callback) => {
      if (!origin && configService.get<string>('NODE_ENV') === 'development') {
        return callback(null, true);
      }
      if (origin === configService.get<string>('CLIENT_URL')) {
        return callback(null, true);
      }
      return callback(new BadRequestException('Not allowed by CORS'), false);
    },
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    optionsSuccessStatus: 200,
    preflightContinue: false, // Do not pass OPTIONS request to other handlers
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  });

  // global exception filter
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  // global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    stopAtFirstError: true,
  }));
  app.setGlobalPrefix('api');

  // swagger docs setup
  setupSwagger(app);

  await app.listen(configService.get('PORT'), '0.0.0.0', (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    } else {
      console.log(`Server listening on ${address}`);
    }
  });
}
bootstrap();
