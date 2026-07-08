import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString() @IsNotEmpty()
  username: string;

  @IsString() @IsNotEmpty()
  password: string;

  @IsIn(['superAdmin', 'restaurantAdmin', 'courier'])
  role: string;

  @IsOptional() @IsString()
  restaurantId?: string;
}
