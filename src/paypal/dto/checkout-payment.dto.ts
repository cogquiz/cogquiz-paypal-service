import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CheckoutPayPalPaymentDto {
  @IsString()
  @IsNotEmpty()
  testDetail: string;

  @IsBoolean()
  @IsOptional()
  isProvider?: boolean;

  @IsString()
  @IsNotEmpty()
  origin: string;
}
