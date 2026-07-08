import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.restaurant.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        emoji: true,
        coverClass: true,
        rating: true,
        deliveryTime: true,
        tags: true,
      },
    });
  }

  async findAllAdmin() {
    return this.prisma.restaurant.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        menuItems: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
      },
    });
    if (!restaurant) throw new NotFoundException(`Restaurant "${id}" not found`);

    const menu: Record<string, any[]> = {};
    for (const item of restaurant.menuItems) {
      if (!menu[item.category]) menu[item.category] = [];
      menu[item.category].push({
        id: item.id,
        name: item.name,
        description: item.description ?? undefined,
        price: item.price,
        emoji: item.emoji,
        special: item.special,
      });
    }

    const { menuItems: _mi, ...rest } = restaurant;
    return { ...rest, menu };
  }

  async create(data: {
    id: string;
    name: string;
    description: string;
    emoji: string;
    coverClass: string;
    rating: number;
    deliveryTime: string;
    tags: string[];
  }) {
    return this.prisma.restaurant.create({ data });
  }

  async update(id: string, data: Partial<{
    name: string;
    description: string;
    emoji: string;
    coverClass: string;
    rating: number;
    deliveryTime: string;
    tags: string[];
    active: boolean;
  }>) {
    const exists = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Restaurant "${id}" not found`);
    return this.prisma.restaurant.update({ where: { id }, data });
  }

  async remove(id: string) {
    const exists = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Restaurant "${id}" not found`);
    await this.prisma.restaurant.delete({ where: { id } });
    return { deleted: true };
  }
}
