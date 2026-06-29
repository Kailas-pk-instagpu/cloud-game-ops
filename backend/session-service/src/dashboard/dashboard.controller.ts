import { Controller, Get, Headers } from '@nestjs/common';
import { SessionsService } from '../sessions/sessions.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private svc: SessionsService) {}

  /** Manager dashboard KPIs for a single branch. */
  @Get('manager')
  manager(@Headers('x-user-branch') branchId: string) {
    return this.svc.dashboard(branchId);
  }
}
