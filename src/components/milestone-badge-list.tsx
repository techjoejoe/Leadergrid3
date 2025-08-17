
'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';

const milestoneBadges = [
  {
    name: 'Intern of Incentives',
    description: 'Awarded for earning your first 200 points.',
    points: 200,
    imageUrl: '/intern-of-incentives.png',
    hint: 'backpack trophy',
  },
  {
    name: 'Point Pioneer',
    description: 'Awarded for earning your first 1,000 points.',
    points: 1000,
    imageUrl: '/PointPioneer.png',
    hint: 'covered wagon',
  },
  {
    name: 'Five-Star Finisher',
    description: 'Awarded for earning a total of 5,000 points.',
    points: 5000,
    imageUrl: '/five-star-finisher.png',
    hint: 'silver medal',
  },
  {
    name: 'Ten-Thousand Triumph',
    description: 'Awarded for earning a monumental 10,000 points.',
    points: 10000,
    imageUrl: '/tenthousand.png',
    hint: 'gold medal',
  },
  {
    name: 'Point Pro',
    description: 'Awarded for achieving 25,000 lifetime points.',
    points: 25000,
    imageUrl: '/PointPro.png',
    hint: 'platinum trophy',
  },
   {
    name: 'Fifty-Thousand Feat',
    description: 'Awarded for achieving 50,000 lifetime points.',
    points: 50000,
    imageUrl: 'https://placehold.co/96x96.png',
    hint: 'diamond trophy',
  },
  {
    name: 'Conquerer of Collection',
    description: 'Awarded for the incredible achievement of 100,000 lifetime points.',
    points: 100000,
    imageUrl: 'https://placehold.co/96x96.png',
    hint: 'glowing award',
  },
];

export function MilestoneBadgeList() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {milestoneBadges.map((badge) => (
        <Card key={badge.name} className="text-center flex flex-col items-center p-4">
          <div className="w-24 h-24 relative mb-2 flex items-center justify-center">
              <Image 
                  src={badge.imageUrl} 
                  alt={badge.name} 
                  width={96}
                  height={96}
                  data-ai-hint={badge.hint}
                  className="mb-2"
                  unoptimized={badge.imageUrl.startsWith('/')}
              />
           </div>
          <h3 className="font-semibold">{badge.name}</h3>
          <p className="text-sm font-bold text-primary mt-1">{badge.points.toLocaleString()} Points</p>
          <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
        </Card>
      ))}
    </div>
  );
}
