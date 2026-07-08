import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.map(({ passwordHash: _h, ...u }) => u);
  }

  async findByRestaurant(restaurantId: string) {
    const users = await this.prisma.user.findMany({
      where: { restaurantId, role: 'courier' },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(({ passwordHash: _h, ...u }) => u);
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existing) throw new ConflictException('Username already exists');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        role: dto.role,
        restaurantId: dto.restaurantId ?? null,
      },
    });
    const { passwordHash: _h, ...result } = user;
    return result;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }

  async updatePassword(id: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { updated: true };
  }

  async setActive(id: string, isActive: boolean) {
    const updated = await this.prisma.user.update({ where: { id }, data: { isActive } });
    const { passwordHash: _h, ...result } = updated;
    return result;
  }

  async reassign(id: string, restaurantId: string | null) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const updated = await this.prisma.user.update({
      where: { id },
      data: { restaurantId },
    });
    const { passwordHash: _h, ...result } = updated;
    return result;
  }
}
