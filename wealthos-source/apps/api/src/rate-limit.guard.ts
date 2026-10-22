import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';

/** Proteção local por processo. Produção com múltiplas réplicas requer armazenamento compartilhado. */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly hits = new Map<string,{count:number;until:number}>();
  canActivate(context:ExecutionContext):boolean {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const now = Date.now();
    for (const [key,value] of this.hits) if (value.until <= now) this.hits.delete(key);
    const authRoute = /\/auth\/(login|register)\/?$/.test(req.path);
    const key = `${req.ip}:${authRoute ? 'auth' : 'api'}`;
    const hit = this.hits.get(key) ?? {count:0,until:now+60000};
    hit.count += 1;
    this.hits.set(key,hit);
    if (hit.count > (authRoute ? 10 : 120)) {
      res.setHeader('Retry-After',Math.max(1,Math.ceil((hit.until-now)/1000)));
      throw new HttpException('Muitas solicitações. Aguarde um minuto.',HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
