import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private svc: SessionsService) {}

  /** List active sessions for the caller's branch. */
  @Get('active')
  active(@Headers('x-user-branch') branchId: string) {
    return this.svc.activeForBranch(branchId);
  }

  /** Start a session: validates seat availability and publishes session.started. */
  @Post('start')
  start(@Headers('x-user-role') role: string, @Body() body: { seat_id: string; player_name: string }) {
    return this.svc.start(role, body.seat_id, body.player_name);
  }

  /** End an active session and return the settlement preview. */
  @Post(':id/end')
  end(@Headers('x-user-role') role: string, @Param('id') id: string) {
    return this.svc.end(role, id);
  }
}
