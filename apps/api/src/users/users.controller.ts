import { Controller, Get, Post, Delete, Param, Body, UseGuards, Patch, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtGuard, RolesGuard)
@Roles('superAdmin', 'restaurantAdmin')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  findAll(@Req() req: any) {
    if (req.user.role === 'restaurantAdmin') {
      return this.users.findByRestaurant(req.user.restaurantId);
    }
    return this.users.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserDto, @Req() req: any) {
    if (req.user.role === 'restaurantAdmin') {
      if (dto.role !== 'courier') throw new ForbiddenException('Can only create couriers');
      dto.restaurantId = req.user.restaurantId;
    }
    return this.users.create(dto);
  }

  @Delete(':id')
  @Roles('superAdmin', 'restaurantAdmin')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }

  @Patch(':id/password')
  @Roles('superAdmin')
  updatePassword(@Param('id') id: string, @Body('password') password: string) {
    return this.users.updatePassword(id, password);
  }

  @Patch(':id/reassign')
  @Roles('superAdmin')
  reassign(@Param('id') id: string, @Body('restaurantId') restaurantId: string | null) {
    return this.users.reassign(id, restaurantId ?? null);
  }
}
