import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser, JwtPayload, Role } from './auth.types.js';

const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined =>
    ctx.switchToHttp().getRequest().user,
);

export function bearerToken(header?: string): string | null {
  if (!header) return null;
  const [type, token] = header.split(' ');
  return type === 'Bearer' && token ? token : null;
}

/** Geçerli bir token zorunlu. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const token = bearerToken(req.headers.authorization);
    if (!token) throw new UnauthorizedException('Giriş yapmalısın');
    try {
      const p = this.jwt.verify<JwtPayload>(token);
      req.user = { id: p.sub, email: p.email, role: p.role } satisfies AuthUser;
      return true;
    } catch {
      throw new UnauthorizedException('Oturumun geçersiz ya da süresi dolmuş');
    }
  }
}

/** Token varsa kullanıcıyı ekler, yoksa misafir olarak devam eder. */
@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const token = bearerToken(req.headers.authorization);
    if (token) {
      try {
        const p = this.jwt.verify<JwtPayload>(token);
        req.user = { id: p.sub, email: p.email, role: p.role } satisfies AuthUser;
      } catch {
        // geçersiz token: misafir gibi davran
      }
    }
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!roles?.length) return true;
    const user: AuthUser | undefined = ctx.switchToHttp().getRequest().user;
    if (!user || !roles.includes(user.role)) throw new ForbiddenException('Bu işlem için yetkin yok');
    return true;
  }
}
