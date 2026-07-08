import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: dto.restaurantId } });
    const total = dto.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const id = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;

    const order = await this.prisma.order.create({
      data: {
        id,
        loungeId: dto.loungeId,
        restaurantId: dto.restaurantId,
        restaurantName: restaurant?.name ?? 'Unknown',
        restaurantEmoji: restaurant?.emoji ?? '🍽️',
        total,
        paymentMethod: dto.paymentMethod,
        status: 'pending',
        notes: dto.notes ?? null,
        items: {
          create: dto.items.map((item) => ({
            id: `${id}-${uuidv4().slice(0, 6)}`,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            emoji: item.emoji,
            special: item.special ?? false,
          })),
        },
      },
      include: { items: true },
    });

    return this.toEntity(order);
  }

  async findAll(): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.toEntity(o));
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException(`Order "${id}" not found`);
    return this.toEntity(order);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const exists = await this.prisma.order.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Order "${id}" not found`);

    const order = await this.prisma.order.update({
      where: { id },
      data: { status, updatedAt: new Date() },
      include: { items: true },
    });
    return this.toEntity(order);
  }

  private toEntity(raw: any): Order {
    return {
      id: raw.id,
      loungeId: raw.loungeId,
      restaurantId: raw.restaurantId,
      restaurantName: raw.restaurantName,
      restaurantEmoji: raw.restaurantEmoji,
      total: raw.total,
      paymentMethod: raw.paymentMethod as any,
      status: raw.status as OrderStatus,
      notes: raw.notes ?? undefined,
      createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : raw.createdAt,
      updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw.updatedAt,
      items: raw.items.map((i: any) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        emoji: i.emoji,
        special: i.special,
      })),
    };
  }
}
