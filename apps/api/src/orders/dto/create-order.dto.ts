import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { DeliveryType } from '../entities/order.entity';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/order.entity';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  emoji: string;

  @IsOptional()
  @IsBoolean()
  special?: boolean;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  loungeId: string;

  @IsString()
  @IsNotEmpty()
  restaurantId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsEnum(['cash', 'terminal', 'transfer'])
  paymentMethod: PaymentMethod;

  @IsEnum(['pickup', 'delivery'])
  deliveryType: DeliveryType;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}
