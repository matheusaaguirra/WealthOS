import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}
  private async session(user: {id:string;name:string;email:string;workspaceId:string}) {
    return {accessToken: await this.jwt.signAsync({sub:user.id,workspaceId:user.workspaceId}), user:{id:user.id,name:user.name,email:user.email,workspaceId:user.workspaceId}};
  }
  async register(dto: RegisterDto) {
    if (Buffer.byteLength(dto.password, 'utf8') > 72) throw new BadRequestException('A senha deve ter até 72 bytes.');
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await hash(dto.password, 12);
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const workspace = await tx.workspace.create({data:{name:`Finanças de ${dto.name.trim()}`.slice(0,100)}});
        return tx.user.create({data:{email,name:dto.name.trim(),passwordHash,workspaceId:workspace.id}});
      });
      return this.session(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Não foi possível cadastrar com estes dados.');
      throw error;
    }
  }
  async login(dto: LoginDto) {
    if (Buffer.byteLength(dto.password, 'utf8') > 72) throw new UnauthorizedException('E-mail ou senha inválidos.');
    const user = await this.prisma.user.findUnique({where:{email:dto.email.trim().toLowerCase()}});
    // Mesmo custo de hash para usuário inexistente; não revela presença do e-mail pelo fluxo da resposta.
    const valid = user ? await compare(dto.password,user.passwordHash) : (await hash(dto.password,12),false);
    if (!user || !valid) throw new UnauthorizedException('E-mail ou senha inválidos.');
    return this.session(user);
  }
}
