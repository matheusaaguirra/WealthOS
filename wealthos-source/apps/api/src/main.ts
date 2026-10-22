import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { getCorsOrigin } from './config';

config({path:resolve(__dirname,'../../../.env')});
async function bootstrap() {
  const app = await NestFactory.create(AppModule,{abortOnError:false,logger:['error','warn']});
  app.use(helmet());
  app.setGlobalPrefix('api');
  app.enableCors({origin:getCorsOrigin(),methods:['GET','POST'],allowedHeaders:['Authorization','Content-Type']});
  app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true,transformOptions:{enableImplicitConversion:false}}));
  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválida.');
  await app.listen(port,'127.0.0.1');
  console.info(`WealthOS API local disponível na porta ${port}.`);
}
bootstrap().catch(()=>{console.error('A API não iniciou. Verifique as variáveis de ambiente e a conexão com PostgreSQL.'); process.exitCode=1;});
