import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export type SessionRequest = Request & { user:{sub:string;workspaceId:string} };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt:JwtService) {}
  async canActivate(context:ExecutionContext):Promise<boolean> {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Entre na sua conta para continuar.');
    try {
      const payload = await this.jwt.verifyAsync(authorization.slice(7),{algorithms:['HS256'],issuer:'wealthos',audience:'wealthos-api'});
      if (typeof payload.sub !== 'string' || !uuid.test(payload.sub) || typeof payload.workspaceId !== 'string' || !uuid.test(payload.workspaceId)) throw new Error('claims');
      request.user = {sub:payload.sub, workspaceId:payload.workspaceId};
      return true;
    } catch { throw new UnauthorizedException('Sessão inválida ou expirada.'); }
  }
}
