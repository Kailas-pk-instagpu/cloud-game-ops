import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, Verify2faDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  /** Authenticate user with email and password. */
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  /** Exchange short-lived temp token + 6-digit code for a full session token. */
  @Post('verify-2fa')
  verify(@Body() dto: Verify2faDto) {
    return this.auth.verify2fa(dto.tempToken, dto.code);
  }

  /** Stateless logout (no server-side token blocklist for POC). */
  @Post('logout')
  logout() {
    return { success: true };
  }
}
