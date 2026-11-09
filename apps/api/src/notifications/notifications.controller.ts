import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/types.js';
import { NotificationsService } from './notifications.service.js';
import { WebPushService } from './web-push.service.js';
import type { NotificationCategory, NotificationPreferences, DeviceTokenPayload } from '@padhai-pilot/shared';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly webPushService: WebPushService,
  ) {}

  /**
   * Public endpoint to get VAPID public key for browser push registration.
   */
  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: this.webPushService.getPublicKey() };
  }

  /**
   * Get user notifications with category filtering and unread count.
   */
  @Get()
  @UseGuards(AuthGuard)
  async getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('category') category?: NotificationCategory,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.notificationsService.getUserNotifications(user.id, {
      category,
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * Fast unread notification count for header bells.
   */
  @Get('unread-count')
  @UseGuards(AuthGuard)
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { unreadCount: count };
  }

  /**
   * Mark a single notification as read.
   */
  @Put(':id/read')
  @UseGuards(AuthGuard)
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  /**
   * Mark all notifications as read for current user.
   */
  @Put('read-all')
  @UseGuards(AuthGuard)
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  /**
   * Register or refresh device push token (Web Push or Mobile FCM).
   */
  @Post('device-token')
  @UseGuards(AuthGuard)
  async registerDeviceToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: DeviceTokenPayload,
  ) {
    return this.notificationsService.registerDeviceToken(user.id, body);
  }

  /**
   * Unregister device push token upon logout.
   */
  @Delete('device-token')
  @UseGuards(AuthGuard)
  async removeDeviceToken(
    @CurrentUser() user: AuthenticatedUser,
    @Query('token') token: string,
  ) {
    return this.notificationsService.removeDeviceToken(user.id, token);
  }

  /**
   * Get current user's granular notification preferences.
   */
  @Get('preferences')
  @UseGuards(AuthGuard)
  async getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getUserPreferences(user.id);
  }

  /**
   * Update granular notification preferences.
   */
  @Put('preferences')
  @UseGuards(AuthGuard)
  async updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: Partial<NotificationPreferences>,
  ) {
    return this.notificationsService.updateUserPreferences(user.id, body);
  }
}

