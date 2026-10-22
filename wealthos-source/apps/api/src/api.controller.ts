import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard, SessionRequest } from './auth.guard';
import { FinanceService } from './finance.service';
import { PrismaService } from './prisma.service';
import { AccountDto, LoginDto, RegisterDto, TransactionDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth:AuthService) {}
  @Post('register') register(@Body() dto:RegisterDto) {return this.auth.register(dto);}
  @Post('login') login(@Body() dto:LoginDto) {return this.auth.login(dto);}
}
@Controller()
@UseGuards(AuthGuard)
export class FinanceController {
  constructor(private readonly finance:FinanceService) {}
  @Get('accounts') accounts(@Req() req:SessionRequest) {return this.finance.listAccounts(req.user.workspaceId);}
  @Post('accounts') createAccount(@Req() req:SessionRequest,@Body() dto:AccountDto) {return this.finance.createAccount(req.user.workspaceId,dto);}
  @Get('transactions') transactions(@Req() req:SessionRequest,@Query('month') month?:string) {return this.finance.listTransactions(req.user.workspaceId,month);}
  @Post('transactions') createTransaction(@Req() req:SessionRequest,@Body() dto:TransactionDto) {return this.finance.createTransaction(req.user.workspaceId,dto);}
  @Post('transactions/:id/reverse') reverse(@Req() req:SessionRequest,@Param('id',new ParseUUIDPipe()) id:string) {return this.finance.reverseTransaction(req.user.workspaceId,id);}
  @Get('summary') summary(@Req() req:SessionRequest,@Query('month') month?:string) {return this.finance.summary(req.user.workspaceId,month);}
}
@Controller('health')
export class HealthController {
  constructor(private readonly prisma:PrismaService) {}
  @Get() async health() {
    try {await this.prisma.$queryRaw`SELECT 1`; return {status:'ok',database:'connected',version:'0.1.0'};}
    catch {throw new ServiceUnavailableException('Banco de dados indisponível.');}
  }
}
