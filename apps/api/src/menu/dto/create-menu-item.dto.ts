import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateMenuItemDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsOptional() @IsString()
  description?: string;

  @IsNumber()
  price: number;

  @IsString() @IsNotEmpty()
  emoji: string;

  @IsOptional() @IsBoolean()
  special?: boolean;

  @IsString() @IsNotEmpty()
  category: string;

  @IsString() @IsNotEmpty()
  restaurantId: string;

  @IsOptional() @IsNumber()
  sortOrder?: number;
}
