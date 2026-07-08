import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class UpdateMenuItemDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsNumber()
  price?: number;

  @IsOptional() @IsString()
  emoji?: string;

  @IsOptional() @IsBoolean()
  special?: boolean;

  @IsOptional() @IsString()
  category?: string;

  @IsOptional() @IsNumber()
  sortOrder?: number;
}
