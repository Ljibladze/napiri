import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private restaurants: RestaurantsService) {}

  @Get()
  findAll() { return this.restaurants.findAll(); }

  @Get('admin/all')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('superAdmin', 'restaurantAdmin')
  findAllAdmin() { return this.restaurants.findAllAdmin(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.restaurants.findOne(id); }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('superAdmin')
  create(@Body() body: any) { return this.restaurants.create(body); }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('superAdmin', 'restaurantAdmin')
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (req.user.role === 'restaurantAdmin') {
      if (req.user.restaurantId !== id) throw new ForbiddenException();
      const { active } = body;
      return this.restaurants.update(id, { active });
    }
    return this.restaurants.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('superAdmin')
  remove(@Param('id') id: string) { return this.restaurants.remove(id); }
}
