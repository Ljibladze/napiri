import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { SEED_RESTAURANTS } from '../data/seed.data';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedRestaurants();
    await this.seedUsers();
  }

  private async seedRestaurants() {
    const count = await this.prisma.restaurant.count();
    if (count > 0) return;

    this.logger.log('Seeding restaurants and menu items...');
    for (const seedR of SEED_RESTAURANTS) {
      const { menu, ...restaurantData } = seedR;
      await this.prisma.restaurant.create({ data: restaurantData });

      let sortOrder = 0;
      for (const [category, items] of Object.entries(menu)) {
        for (const item of items) {
          await this.prisma.menuItem.create({
            data: {
              name: item.name,
              description: item.description ?? null,
              price: item.price,
              emoji: item.emoji,
              special: item.special ?? false,
              category,
              sortOrder: sortOrder++,
              restaurantId: seedR.id,
            },
          });
        }
      }
    }
    this.logger.log('Restaurants and menu seeded');
  }

  private async seedUsers() {
    const superAdminPass = process.env.SUPER_ADMIN_PASS ?? 'napiri2024';

    const toSeed = [
      { username: 'superadmin',  password: superAdminPass, role: 'superAdmin',      restaurantId: null },
      { username: 'courier1',    password: 'juvaxa123',    role: 'courier',          restaurantId: null },
      { username: 'olympos',     password: 'juvaxa123',    role: 'restaurantAdmin',  restaurantId: '1' },
      { username: 'bluebay',     password: 'juvaxa123',    role: 'restaurantAdmin',  restaurantId: '2' },
      { username: 'sanapiro',    password: 'juvaxa123',    role: 'restaurantAdmin',  restaurantId: '3' },
    ];

    for (const u of toSeed) {
      const exists = await this.prisma.user.findUnique({ where: { username: u.username } });
      if (exists) continue;
      await this.prisma.user.create({
        data: {
          username: u.username,
          passwordHash: await bcrypt.hash(u.password, 10),
          role: u.role,
          restaurantId: u.restaurantId,
        },
      });
      this.logger.log(`Seeded user: ${u.username}`);
    }
  }
}
