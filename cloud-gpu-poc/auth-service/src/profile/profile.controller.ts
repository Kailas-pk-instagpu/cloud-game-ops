import { Body, Controller, Get, Headers, Patch, UnauthorizedException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from '../auth/dto';

@Controller('profile')
export class ProfileController {
  constructor(private svc: ProfileService) {}

  /** Return current user profile with completion percentage. */
  @Get()
  get(@Headers('x-user-id') userId: string) {
    if (!userId) throw new UnauthorizedException();
    return this.svc.get(userId);
  }

  /** Update editable profile fields. */
  @Patch()
  update(@Headers('x-user-id') userId: string, @Body() dto: UpdateProfileDto) {
    if (!userId) throw new UnauthorizedException();
    return this.svc.update(userId, dto as any);
  }
}
