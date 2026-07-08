import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ForbiddenException, Req } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('menu')
export class MenuController {
  constructor(private menu: MenuService) {}

  @Get(':restaurantId')
  findByRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.menu.findByRestaurant(restaurantId);
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('superAdmin', 'restaurantAdmin')
  create(@Body() dto: CreateMenuItemDto, @Req() req: any) {
    if (req.user.role === 'restaurantAdmin' && dto.restaurantId !== req.user.restaurantId) {
      throw new ForbiddenException();
    }
    return this.menu.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('superAdmin', 'restaurantAdmin')
  update(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menu.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('superAdmin', 'restaurantAdmin')
  remove(@Param('id') id: string) {
    return this.menu.remove(id);
  }
}
