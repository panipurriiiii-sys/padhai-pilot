/** DTOs are intentionally untyped (`unknown`): the shared validator is the single authority and rejects unknown keys. */
export class ValidateThemeDto {
  config?: unknown;
}

export class PublishThemeDto {
  config?: unknown;
  /** Why the change was made (stored in the audit history) */
  reason?: string;
}

export class RestoreThemeDto {
  reason?: string;
}

export class UpdateBrandingDto {
  logoUrl?: string | null;
  accentColor?: string | null;
}
