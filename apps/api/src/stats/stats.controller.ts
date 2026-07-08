import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('stats')
@UseGuards(JwtGuard, RolesGuard)
@Roles('superAdmin')
export class StatsController {
  constructor(private stats: StatsService) {}

  @Get()
  getStats(@Query('from') from?: string, @Query('to') to?: string) {
    return this.stats.getStats(from, to);
  }
}
