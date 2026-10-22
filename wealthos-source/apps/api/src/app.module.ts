import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthController, FinanceController, HealthController } from './api.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { FinanceService } from './finance.service';
import { PrismaService } from './prisma.service';
import { RateLimitGuard } from './rate-limit.guard';
import { getJwtSecret } from './config';

@Module({
 imports:[JwtModule.registerAsync({useFactory:()=>({secret:getJwtSecret(),signOptions:{expiresIn:'1h',algorithm:'HS256',issuer:'wealthos',audience:'wealthos-api'}})})],
 controllers:[AuthController,FinanceController,HealthController],
 providers:[PrismaService,AuthService,FinanceService,AuthGuard,{provide:APP_GUARD,useClass:RateLimitGuard}],
})
export class AppModule {}
