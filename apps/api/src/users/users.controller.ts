import { Controller, Get, Post, Delete, Param, Body, UseGuards, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtGuard, RolesGuard)
@Roles('superAdmin')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  findAll() { return this.users.findAll(); }

  @Post()
  create(@Body() dto: CreateUserDto) { return this.users.create(dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.users.remove(id); }

  @Patch(':id/password')
  updatePassword(@Param('id') id: string, @Body('password') password: string) {
    return this.users.updatePassword(id, password);
  }
}
