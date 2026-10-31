import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/types.js';
import { authCookieOptions, isDemoMode } from '../common/security/runtime.js';

type SessionResult = { user: AuthenticatedUser; token: string };

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  private startSession(res: Response, result: SessionResult) {
    res.cookie('token', result.token, authCookieOptions());
    return { success: true, user: result.user, token: result.token };
  }

  private requireDemoMode() {
    if (!isDemoMode()) throw new NotFoundException();
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { email?: string; password?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const forwarded = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
    const clientIp = forwarded || req.ip || '127.0.0.1';
    const result = await this.authService.validateAndLogin(body?.email as string, body?.password as string, clientIp);
    return this.startSession(res, result);
  }

  /** Public sign-up for a new tuition (TUITION_OWNER). Faculty are invited; SUPER_ADMIN is bootstrapped. */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body()
    body: {
      fullName: string;
      email: string;
      password: string;
      invitationCode?: string;
      instituteName?: string;
      subject?: string;
      role?: 'TEACHER' | 'TUITION_OWNER';
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.startSession(res, await this.authService.registerTeacher(body));
  }

  @Post('register-student')
  @HttpCode(HttpStatus.CREATED)
  async registerStudent(
    @Body()
    body: {
      fullName: string;
      email: string;
      password: string;
      phone?: string;
      invitationCode?: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.startSession(res, await this.authService.registerStudent(body));
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPass: string,
  ) {
    return this.authService.resetPassword(token, newPass);
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body('oldPassword') oldPass: string,
    @Body('newPassword') newPass: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.changePassword(user.id, oldPass, newPass);
    // The password change invalidates all other sessions; the caller keeps working with a fresh token.
    if (result.session) return this.startSession(res, result.session);
    return { success: result.success };
  }

  @Put('profile')
  @UseGuards(AuthGuard)
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { fullName?: string; phone?: string },
  ) {
    const updated = await this.authService.updateProfile(user.id, body);
    return { success: true, user: updated };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', { path: '/' });
    return { success: true, message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      authenticated: true,
      user,
    };
  }

  // ---- Demo sessions: development/test only, 404 in production ----

  @Get('demo-teacher')
  async getDemoToken(@Res({ passthrough: true }) res: Response) {
    this.requireDemoMode();
    return this.startSession(res, await this.authService.getDemoTeacher());
  }

  @Post('demo-teacher')
  postDemoToken(@Res({ passthrough: true }) res: Response) {
    return this.getDemoToken(res);
  }

  @Get('demo-owner')
  async getDemoOwnerToken(@Res({ passthrough: true }) res: Response) {
    this.requireDemoMode();
    return this.startSession(res, await this.authService.getDemoOwner());
  }

  @Get('demo-admin')
  async getDemoAdminToken(@Res({ passthrough: true }) res: Response) {
    this.requireDemoMode();
    return this.startSession(res, await this.authService.getDemoAdmin());
  }

  @Get('demo-student')
  async getDemoStudentToken(@Res({ passthrough: true }) res: Response) {
    this.requireDemoMode();
    return this.startSession(res, await this.authService.getDemoStudent());
  }

  @Post('demo-student')
  postDemoStudentToken(@Res({ passthrough: true }) res: Response) {
    return this.getDemoStudentToken(res);
  }
}
