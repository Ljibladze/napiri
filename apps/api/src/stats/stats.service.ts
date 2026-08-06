import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getStats(from?: string, to?: string) {
    const where: any = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const [orders, restaurants, couriers] = await Promise.all([
      this.prisma.order.findMany({ where, orderBy: { createdAt: 'desc' } }),
      this.prisma.restaurant.findMany(),
      this.prisma.user.findMany({ where: { role: 'courier' } }),
    ]);

    const byRestaurant = restaurants.map((r) => {
      const rOrders = orders.filter((o) => o.restaurantId === r.id);
      const revenue = rOrders
        .filter((o) => o.status !== 'cancelled')
        .reduce((s, o) => s + o.total, 0);
      const rDone = rOrders.filter((o) => o.status === 'delivered');
      const rPickup = rDone.filter((o) => o.deliveryType === 'pickup');
      const rDelivery = rDone.filter((o) => o.deliveryType !== 'pickup');
      const rPickupSvc = rPickup.reduce((s, o) => s + (o.serviceCharge ?? 0), 0);
      const rDeliverySvc = rDelivery.reduce((s, o) => s + (o.serviceCharge ?? 0), 0);
      return {
        id: r.id, name: r.name, emoji: r.emoji, orders: rOrders.length, revenue,
        serviceBreakdown: {
          pickupCount: rPickup.length,
          deliveryCount: rDelivery.length,
          pickupServiceTotal: Math.round(rPickupSvc * 100) / 100,
          deliveryServiceTotal: Math.round(rDeliverySvc * 100) / 100,
          courierShare: Math.round((rDeliverySvc / 2) * 100) / 100,
          platformShare: Math.round((rPickupSvc + rDeliverySvc / 2) * 100) / 100,
        },
      };
    }).sort((a, b) => b.orders - a.orders);

    const delivered = orders.filter((o) => o.status === 'delivered');
    const byCourier = couriers.map((c) => {
      const myDeliveries = delivered.filter((o) => o.courierId === c.id);
      const byRestaurantBreakdown = restaurants.map((r) => ({
        id: r.id,
        name: r.name,
        emoji: r.emoji,
        count: myDeliveries.filter((o) => o.restaurantId === r.id).length,
      })).filter((r) => r.count > 0);
      return {
        courierId: c.id,
        username: c.username,
        restaurantId: c.restaurantId,
        deliveries: myDeliveries.length,
        revenue: myDeliveries.reduce((s, o) => s + o.total, 0),
        byRestaurant: byRestaurantBreakdown,
      };
    }).sort((a, b) => b.deliveries - a.deliveries);

    const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});

    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((s, o) => s + o.total, 0);

    const allPickup = delivered.filter((o) => o.deliveryType === 'pickup');
    const allDelivery = delivered.filter((o) => o.deliveryType !== 'pickup');
    const allPickupSvc = allPickup.reduce((s, o) => s + (o.serviceCharge ?? 0), 0);
    const allDeliverySvc = allDelivery.reduce((s, o) => s + (o.serviceCharge ?? 0), 0);
    const serviceBreakdown = {
      pickupCount: allPickup.length,
      deliveryCount: allDelivery.length,
      pickupServiceTotal: Math.round(allPickupSvc * 100) / 100,
      deliveryServiceTotal: Math.round(allDeliverySvc * 100) / 100,
      courierShare: Math.round((allDeliverySvc / 2) * 100) / 100,
      platformShare: Math.round((allPickupSvc + allDeliverySvc / 2) * 100) / 100,
    };

    return {
      totalOrders: orders.length,
      totalRevenue,
      byRestaurant,
      byCourier,
      byStatus,
      serviceBreakdown,
      recent: orders.slice(0, 20),
    };
  }
}
