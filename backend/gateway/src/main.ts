import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Module, Controller, Get, All, Req, Res, UnauthorizedException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import axios from 'axios';
import type { Request, Response } from 'express';

const TARGETS: Record<string, string> = {
  '/api/auth':       process.env.AUTH_SERVICE_URL,
  '/api/profile':    process.env.AUTH_SERVICE_URL,
  '/api/settings':   process.env.AUTH_SERVICE_URL,
  '/api/sessions':   process.env.SESSION_SERVICE_URL,
  '/api/seats':      process.env.SESSION_SERVICE_URL,
  '/api/manager':    process.env.SESSION_SERVICE_URL,
  '/api/owner':      process.env.CAFE_MGMT_SERVICE_URL,
  '/api/branches':   process.env.CAFE_MGMT_SERVICE_URL,
  '/api/settlements':process.env.CAFE_MGMT_SERVICE_URL,
  '/api/dashboard/manager': process.env.SESSION_SERVICE_URL,
  '/api/dashboard/owner':   process.env.CAFE_MGMT_SERVICE_URL,
};

const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/verify-2fa', '/health'];

const ROLE_PREFIXES: { prefix: string; roles: string[] }[] = [
  { prefix: '/api/owner', roles: ['cafe_owner'] },
  { prefix: '/api/manager', roles: ['manager'] },
  { prefix: '/api/dashboard/owner', roles: ['cafe_owner'] },
  { prefix: '/api/dashboard/manager', roles: ['manager'] },
];

function resolveTarget(url: string): { base: string; downstream: string } | null {
  // Strip /api prefix and route /api/dashboard/* by full path.
  const path = url.split('?')[0];
  const keys = Object.keys(TARGETS).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (path.startsWith(k)) {
      const downstream = path.replace(/^\/api/, '');
      return { base: TARGETS[k], downstream };
    }
  }
  return null;
}

@Injectable()
class ProxyService {
  constructor(private jwt: JwtService) {}

  async handle(req: Request, res: Response) {
    const url = req.originalUrl;
    if (PUBLIC_PATHS.some(p => url.startsWith(p))) {
      return this.forward(req, res, null);
    }

    const auth = req.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing token');
    let payload: any;
    try { payload = this.jwt.verify(auth.slice(7)); } catch { throw new UnauthorizedException('Invalid token'); }

    for (const g of ROLE_PREFIXES) {
      if (url.startsWith(g.prefix) && !g.roles.includes(payload.role)) {
        throw new ForbiddenException('Role not permitted');
      }
    }
    return this.forward(req, res, payload);
  }

  private async forward(req: Request, res: Response, payload: any | null) {
    const target = resolveTarget(req.originalUrl);
    if (!target) { res.status(404).json({ error: true, message: 'Route not found', code: 'NOT_FOUND' }); return; }

    const headers: Record<string, string> = {
      'content-type': req.headers['content-type'] as string || 'application/json',
    };
    if (payload) {
      headers['x-user-id'] = payload.sub;
      headers['x-user-role'] = payload.role;
      if (payload.branch_id) headers['x-user-branch'] = payload.branch_id;
    }

    try {
      const r = await axios({
        method: req.method as any,
        url: target.base + target.downstream,
        data: req.body,
        headers,
        validateStatus: () => true,
      });
      res.status(r.status).json(r.data);
    } catch (e: any) {
      res.status(502).json({ error: true, message: 'Upstream error: ' + e.message, code: 'INTERNAL_ERROR' });
    }
  }
}

@Controller()
class ProxyController {
  constructor(private svc: ProxyService) {}
  @Get('/health') health() { return { status:'ok', service:'gateway', timestamp:new Date().toISOString() }; }
  @All('/api/*') all(@Req() req: Request, @Res() res: Response) { return this.svc.handle(req, res); }
}

@WebSocketGateway({ path: '/live', cors: { origin: '*' } })
class LiveGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  afterInit() {
    setInterval(async () => {
      try {
        // Broadcast seat snapshot for the demo branch (first branch).
        const r = await axios.get(process.env.CAFE_MGMT_SERVICE_URL + '/branches', {
          headers: { 'x-user-role': 'cafe_owner', 'x-user-id': '00000000-0000-0000-0000-000000000000' },
          validateStatus: () => true,
        });
        this.server.emit('seat-grid-update', { timestamp: new Date().toISOString(), branches: r.data });
      } catch {}
    }, 30000);
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  controllers: [ProxyController],
  providers: [ProxyService, LiveGateway],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());
  app.enableCors({ origin: true });
  app.useWebSocketAdapter(new IoAdapter(app));
  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`[gateway] listening on ${port}`);
}
bootstrap();
