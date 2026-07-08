import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersGateway } from './orders.gateway';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  @Get()
  findAll(@Query('restaurantId') restaurantId?: string) {
    if (restaurantId) return this.ordersService.findByRestaurant(restaurantId);
    return this.ordersService.findAll();
  }

  @Get('courier/:courierId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('courier', 'superAdmin', 'restaurantAdmin')
  findByCourier(@Param('courierId') courierId: string) {
    return this.ordersService.findByCourier(courierId);
  }

  @Get('courier-stats')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('superAdmin', 'restaurantAdmin')
  courierStats(@Query('restaurantId') restaurantId?: string) {
    return this.ordersService.courierStats(restaurantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const order = await this.ordersService.create(dto);
    this.ordersGateway.emitNewOrder(order);
    return order;
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    const order = await this.ordersService.updateStatus(id, dto.status, dto.courierId);
    this.ordersGateway.emitOrderUpdated(order);
    return order;
  }
}
