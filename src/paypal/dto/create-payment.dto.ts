import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreatePayPalPaymentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsString()
  @IsNotEmpty()
  payerId: string;

  testDetail: string;

  @IsBoolean()
  @IsOptional()
  isProvider?: boolean;
}
