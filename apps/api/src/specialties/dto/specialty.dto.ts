import { IsOptional, IsString, MaxLength } from 'class-validator';
export class CreateSpecialtyDto {
  @IsString() @MaxLength(255) name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(255) icon_url?: string; // file upload: see MIGRATION.md §Uploads
}
export class UpdateSpecialtyDto {
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(255) icon_url?: string;
}
