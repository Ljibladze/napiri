export class MenuItemDto {
  id: string;
  name: string;
  description?: string;
  price: number;
  emoji: string;
  special?: boolean;
}

export class RestaurantSummaryDto {
  id: string;
  name: string;
  description: string;
  emoji: string;
  coverClass: string;
  rating: number;
  deliveryTime: string;
  tags: string[];
}

export class RestaurantDetailDto extends RestaurantSummaryDto {
  menu: Record<string, MenuItemDto[]>;
}
