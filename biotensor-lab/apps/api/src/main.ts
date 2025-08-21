import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.use(cors({ origin, credentials: true }));
  const port = process.env.PORT || 4000;
  await app.listen(port as number);
  console.log(`API listening on http://localhost:${port}`);
}
bootstrap();
