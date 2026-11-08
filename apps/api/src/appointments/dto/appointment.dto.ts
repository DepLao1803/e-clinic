import { ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export class StoreAppointmentDto {
  @IsInt({ message: 'Vui lòng chọn bác sĩ.' }) doctor_id: number;
  @IsInt({ message: 'Vui lòng chọn khung giờ khám.' }) schedule_id: number;
  @Matches(YMD, { message: 'Ngày hẹn phải đúng định dạng YYYY-MM-DD.' }) appointment_date: string;
  @IsOptional() @IsString() @MaxLength(255) reason?: string;
  @IsIn(['online', 'offline'], { message: 'Hình thức khám không hợp lệ (chỉ chấp nhận online hoặc offline).' }) type: 'online' | 'offline';
  @IsArray({ message: 'Vui lòng chọn ít nhất một dịch vụ y tế.' }) @ArrayMinSize(1, { message: 'Vui lòng chọn ít nhất một dịch vụ y tế.' })
  @IsInt({ each: true }) service_ids: number[];
}

export class UpdateAppointmentDto {
  @IsOptional() @IsInt() doctor_id?: number;
  @IsOptional() @IsInt() schedule_id?: number;
  @IsOptional() @Matches(YMD, { message: 'Ngày hẹn phải đúng định dạng YYYY-MM-DD.' }) appointment_date?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsIn(['pending', 'confirmed', 'completed', 'cancelled']) status?: string;
  @IsOptional() @IsIn(['online', 'offline']) type?: string;
  @IsOptional() @IsArray() @IsInt({ each: true }) service_ids?: number[];
}
