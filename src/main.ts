import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('SERVICE_PORT', 3006);
  const serviceName = configService.get<string>('SERVICE_NAME', 'cogquiz-paypal-service');

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.setGlobalPrefix('api');

  await app.listen(port);
  console.log(`${serviceName} is running on port ${port}`);
}
bootstrap();
