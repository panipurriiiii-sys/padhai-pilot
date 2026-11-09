import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationDispatcherService } from './notification-dispatcher.service.js';
import { WebPushService } from './web-push.service.js';
import { FcmPushService } from './fcm-push.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationDispatcherService,
    WebPushService,
    FcmPushService,
  ],
  exports: [
    NotificationsService,
    NotificationDispatcherService,
    WebPushService,
    FcmPushService,
  ],
})
export class NotificationsModule {}
