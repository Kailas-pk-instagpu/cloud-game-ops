import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ProfileService } from '../profile/profile.service';
import { Toggle2faDto } from '../auth/dto';

@Controller('settings/2fa')
export class SettingsController {
  constructor(private svc: ProfileService) {}

  /** Enable or disable 2FA for the current user. */
  @Post('toggle')
  toggle(@Headers('x-user-id') userId: string, @Body() dto: Toggle2faDto) {
    if (!userId) throw new UnauthorizedException();
    return this.svc.toggle2fa(userId, !!dto.enable);
  }
}
