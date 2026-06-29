import { Controller, Get } from '@nestjs/common';

/** Service liveness check. */
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() };
  }
}
