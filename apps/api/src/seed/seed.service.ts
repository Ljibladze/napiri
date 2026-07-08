import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { SEED_RESTAURANTS } from '../data/seed.data';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedUsers();
    await this.seedRestaurants();
  }

  private async seedUsers() {
    const count = await this.prisma.user.count();
    if (count > 0) return;

    this.logger.log('Seeding initial users...');
    const superPass = process.env.SUPER_ADMIN_PASS ?? 'napiri2024';

    await this.prisma.user.createMany({
      data: [
        {
          username: 'superadmin',
          passwordHash: await bcrypt.hash(superPass, 10),
          role: 'superAdmin',
        },
        {
          username: 'courier1',
          passwordHash: await bcrypt.hash('juvaxa123', 10),
          role: 'courier',
        },
      ],
    });
    this.logger.log('Users seeded');
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
}
