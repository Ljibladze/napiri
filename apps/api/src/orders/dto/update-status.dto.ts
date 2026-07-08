import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class UpdateStatusDto {
  @IsEnum(['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'])
  status: OrderStatus;

  @IsOptional() @IsString()
  courierId?: string;
}
