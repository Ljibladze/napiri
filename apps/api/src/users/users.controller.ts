import { Controller, Get, Post, Delete, Param, Body, UseGuards, Patch, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  getMe(@Req() req: any) {
    return this.users.findById(req.user.sub);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('superAdmin', 'restaurantAdmin')
  findAll(@Req() req: any) {
    if (req.user.role === 'restaurantAdmin') {
      return this.users.findByRestaurant(req.user.restaurantId);
    }
    return this.users.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superAdmin', 'restaurantAdmin')
  create(@Body() dto: CreateUserDto, @Req() req: any) {
    if (req.user.role === 'restaurantAdmin') {
      if (dto.role !== 'courier') throw new ForbiddenException('Can only create couriers');
      dto.restaurantId = req.user.restaurantId;
    }
    return this.users.create(dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('superAdmin', 'restaurantAdmin')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }

  @Patch(':id/password')
  @UseGuards(RolesGuard)
  @Roles('superAdmin')
  updatePassword(@Param('id') id: string, @Body('password') password: string) {
    return this.users.updatePassword(id, password);
  }

  @Patch('me/active')
  @UseGuards(RolesGuard)
  @Roles('courier')
  setActive(@Req() req: any, @Body('isActive') isActive: boolean) {
    return this.users.setActive(req.user.sub, isActive);
  }

  @Patch(':id/reassign')
  @UseGuards(RolesGuard)
  @Roles('superAdmin')
  reassign(@Param('id') id: string, @Body('restaurantId') restaurantId: string | null) {
    return this.users.reassign(id, restaurantId ?? null);
  }

  @Post(':id/restaurants')
  @UseGuards(RolesGuard)
  @Roles('superAdmin', 'restaurantAdmin')
  addRestaurant(
    @Param('id') id: string,
    @Body('restaurantId') restaurantId: string,
    @Req() req: any,
  ) {
    if (req.user.role === 'restaurantAdmin' && restaurantId !== req.user.restaurantId) {
      throw new ForbiddenException('Can only manage your own restaurant');
    }
    return this.users.addRestaurant(id, restaurantId);
  }

  @Delete(':id/restaurants/:restaurantId')
  @UseGuards(RolesGuard)
  @Roles('superAdmin', 'restaurantAdmin')
  removeRestaurant(
    @Param('id') id: string,
    @Param('restaurantId') restaurantId: string,
    @Req() req: any,
  ) {
    if (req.user.role === 'restaurantAdmin' && restaurantId !== req.user.restaurantId) {
      throw new ForbiddenException('Can only manage your own restaurant');
    }
    return this.users.removeRestaurant(id, restaurantId);
  }
}
