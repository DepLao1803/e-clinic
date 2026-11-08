import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
export class StoreReviewDto {
  @IsInt() appointment_id: number;
  @IsOptional() @IsInt() doctor_id?: number; // ignored: derived from the appointment (as in Laravel)
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @IsString() @MaxLength(2000) comment?: string;
}
