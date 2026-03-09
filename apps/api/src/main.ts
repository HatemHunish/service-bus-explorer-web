import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Service Bus Explorer API')
    .setDescription('API for managing Azure Service Bus, Event Hubs, Event Grid, and more')
    .setVersion('1.0')
    .addTag('connections', 'Connection management')
    .addTag('queues', 'Service Bus queue operations')
    .addTag('topics', 'Service Bus topic operations')
    .addTag('subscriptions', 'Service Bus subscription operations')
    .addTag('messages', 'Message operations')
    .addTag('event-hubs', 'Event Hubs operations')
    .addTag('event-grid', 'Event Grid operations')
    .addTag('notification-hubs', 'Notification Hubs operations')
    .addTag('relays', 'Relay operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || 3002;
  await app.listen(port);

  console.log(`🚀 Service Bus Explorer API is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
