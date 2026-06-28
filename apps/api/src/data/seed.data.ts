export interface SeedMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  emoji: string;
  special?: boolean;
}

export interface SeedRestaurant {
  id: string;
  name: string;
  description: string;
  emoji: string;
  coverClass: string;
  rating: number;
  deliveryTime: string;
  tags: string[];
  menu: Record<string, SeedMenuItem[]>;
}

const JAVAKHA_BURGER: SeedMenuItem = {
  id: 'special-burger',
  name: 'ჯავახას ფაჩრიანი ბურგერი',
  description: 'სპეც ბურგერი — 5 გრამი ჯავახას ფაჩარი, 200გ საქონელი, ფაჩი, ბეკონი, ედამი, BBQ სოუსი, კარამელ ხახვი',
  price: 32,
  emoji: '🍔',
  special: true,
};

export const SEED_RESTAURANTS: SeedRestaurant[] = [
  {
    id: '1',
    name: 'ოლიმპოსი',
    description: 'ქართული და ხმელთაშუა ზღვის ტრადიციული სამზარეულო',
    emoji: '🏛️',
    coverClass: 'grad-olympos',
    rating: 4.8,
    deliveryTime: '15-20 წთ',
    tags: ['ქართული', 'ხინკალი', 'ხაჭაპური', 'მწვადი'],
    menu: {
      '⭐ სპეციალობა': [JAVAKHA_BURGER],
      'სასმელები': [
        { id: '1-1', name: 'სახლის ლიმონათი', description: 'ახალი ლიმონი, პიტნა, ბუნებრივი შაქარი', price: 8, emoji: '🍋' },
        { id: '1-2', name: 'მინერალური წყალი', price: 3, emoji: '💧' },
      ],
      'სენდვიჩები': [
        { id: '1-3', name: 'კლუბ სენდვიჩი', description: 'ქათამი, ბეკონი, ლეტუსი, პომიდვრი, ედამი', price: 18, emoji: '🥪' },
        { id: '1-4', name: 'სულუგუნის სენდვიჩი', description: 'სახლის სულუგუნი, ახალი ბოსტნეული, ბაზილიკი', price: 14, emoji: '🧀' },
        { id: '1-5', name: 'ბეკონ-ჩიზ სენდვიჩი', description: 'ბეკონი, ჩედარი, კიტრი, BBQ სოუსი', price: 16, emoji: '🥓' },
      ],
    },
  },
  {
    id: '2',
    name: 'ბლუ ბეი',
    description: 'ზღვის პროდუქტები, სუში და კოქტეილები სანაპიროდან',
    emoji: '🌊',
    coverClass: 'grad-bluebay',
    rating: 4.9,
    deliveryTime: '20-25 წთ',
    tags: ['ზღვა', 'სუში', 'კოქტეილი', 'კრევეტი'],
    menu: {
      '⭐ სპეციალობა': [JAVAKHA_BURGER],
      'სასმელები': [
        { id: '2-1', name: 'სახლის ლიმონათი', description: 'ლაიმი, პიტნა, სოდა', price: 9, emoji: '🍋' },
        { id: '2-2', name: 'Virgin Mojito', description: 'ალკოჰოლის გარეშე, ახალი', price: 14, emoji: '🌿' },
      ],
      'სენდვიჩები': [
        { id: '2-3', name: 'კრევეტის სენდვიჩი', description: 'გრილ კრევეტი, ავოკადო, ლაიმ-სოუსი, ლეტუსი', price: 24, emoji: '🦐' },
        { id: '2-4', name: 'ტუნას სენდვიჩი', description: 'ახალი ტუნა, კიტრი, ნაღებიანი სოუსი', price: 20, emoji: '🐟' },
        { id: '2-5', name: 'ბეიგლი სალმონით', description: 'ორაგული, კრემ-ყველი, კაპარსი', price: 22, emoji: '🥯' },
      ],
    },
  },
  {
    id: '3',
    name: 'სანაპირო',
    description: 'ბურგერები, სნეკები და გამაგრილებელი სასმელები',
    emoji: '🏖️',
    coverClass: 'grad-sanapiro',
    rating: 4.6,
    deliveryTime: '10-15 წთ',
    tags: ['ბურგერი', 'სნეკი', 'ლუდი', 'ყინული'],
    menu: {
      '⭐ სპეციალობა': [JAVAKHA_BURGER],
      'სასმელები': [
        { id: '3-1', name: 'სახლის ლიმონათი', description: 'ახლად გამოწური, ზაფრანა', price: 8, emoji: '🍋' },
        { id: '3-2', name: 'Coca-Cola / Sprite', description: '0.33ლ, ყინულით', price: 5, emoji: '🥤' },
      ],
      'სენდვიჩები': [
        { id: '3-3', name: 'კლასიკური სენდვიჩი', description: '180გ ქათამი, ლეტუსი, პომიდვრი, კეტჩუპი', price: 16, emoji: '🥪' },
        { id: '3-4', name: 'Smash სენდვიჩი', description: 'ორმაგი ბარგი, ბეკონი, ედამი, BBQ', price: 22, emoji: '🍔' },
        { id: '3-5', name: 'ვეგი სენდვიჩი', description: 'ბოსტნეულის კოტლეტი, ჰუმუსი, ავოკადო', price: 16, emoji: '🥑' },
      ],
    },
  },
];
