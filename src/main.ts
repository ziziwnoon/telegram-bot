import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets("public")
  const PORT = process.env.PORT
  await app.listen(PORT, () => {
    console.log(`Server is running...🏃‍♂️`);
  });
}
bootstrap();
