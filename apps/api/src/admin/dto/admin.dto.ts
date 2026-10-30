import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsIn,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import type { SubscriptionPlan } from '@padhai-pilot/shared';

export class CreateInstituteTenantDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  subdomain!: string;

  @IsString()
  @IsIn(['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE'])
  plan!: SubscriptionPlan;

  @IsString()
  @IsNotEmpty()
  ownerName!: string;

  @IsEmail()
  ownerEmail!: string;

  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @IsString()
  @IsOptional()
  customDomain?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED', 'TRIAL'])
  status?: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
}

export class UpdateInstituteStatusDto {
  @IsString()
  @IsIn(['ACTIVE', 'SUSPENDED', 'TRIAL'])
  status!: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';

  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class UpdateInstitutePlanDto {
  @IsString()
  @IsIn(['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE'])
  plan!: SubscriptionPlan;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateTenantConfigDto {
  @IsString()
  @IsOptional()
  customDomain?: string;

  @IsBoolean()
  @IsOptional()
  isWhiteLabel?: boolean;

  @IsBoolean()
  @IsOptional()
  isDedicatedDb?: boolean;

  @IsString()
  @IsOptional()
  themePrimaryColor?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsNumber()
  @IsOptional()
  maxStudentsLimit?: number;

  @IsNumber()
  @IsOptional()
  maxTeachersLimit?: number;
}

export class CreatePlatformAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsIn(['info', 'warning', 'critical'])
  severity!: 'info' | 'warning' | 'critical';

  @IsString()
  @IsOptional()
  @IsIn(['ALL', 'TEACHERS', 'STUDENTS'])
  targetAudience?: 'ALL' | 'TEACHERS' | 'STUDENTS';

  @IsString()
  @IsOptional()
  expiresAt?: string;
}

