import { Controller, Delete, UseGuards } from '@nestjs/common';
import { JwtGuard } from './auth/guards/jwt.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { PrismaService } from './prisma/prisma.service';

@Controller('admin')
@UseGuards(JwtGuard, RolesGuard)
@Roles('superAdmin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Delete('reset')
  async reset() {
    await this.prisma.orderItem.deleteMany();
    await this.prisma.order.deleteMany();
    await this.prisma.menuItem.deleteMany();
    await this.prisma.user.deleteMany({ where: { role: { not: 'superAdmin' } } });
    await this.prisma.restaurant.deleteMany();
    return { ok: true };
  }
}
