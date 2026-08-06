import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';
import { MenuModule } from './menu/menu.module';
import { StatsModule } from './stats/stats.module';
import { SeedModule } from './seed/seed.module';
import { HealthController } from './health.controller';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RestaurantsModule,
    OrdersModule,
    UsersModule,
    MenuModule,
    StatsModule,
    SeedModule,
  ],
  controllers: [HealthController, AdminController],
})
export class AppModule {}
