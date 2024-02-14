import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser'
import * as bodyParser from 'body-parser'
import { env } from 'env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
    app.enableCors({
        origin: "http://localhost:3000",
        credentials: true,
    })
    app.use(cookieParser())
    app.use(bodyParser.json({ limit: '50mb' }))
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
    await app.listen(env.BACKEND_PORT)
}

bootstrap();
