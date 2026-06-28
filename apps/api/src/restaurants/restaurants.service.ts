import { Injectable, NotFoundException } from '@nestjs/common';
import { SEED_RESTAURANTS } from '../data/seed.data';
import { RestaurantDetailDto, RestaurantSummaryDto } from './dto/restaurant-response.dto';

@Injectable()
export class RestaurantsService {
  findAll(): RestaurantSummaryDto[] {
    return SEED_RESTAURANTS.map(({ menu: _menu, ...summary }) => summary);
  }

  findOne(id: string): RestaurantDetailDto {
    const restaurant = SEED_RESTAURANTS.find((r) => r.id === id);
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with id "${id}" not found`);
    }
    return restaurant;
  }
}
