
'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';

const milestoneBadges = [
  {
    name: 'Point Pioneer',
    description: 'Awarded for earning your first 1,000 points.',
    points: 1000,
    imageUrl: '/badges/milestone_1k.png',
  },
  {
    name: 'Five-Star Finisher',
    description: 'Awarded for earning a total of 5,000 points.',
    points: 5000,
    imageUrl: '/badges/milestone_5k.png',
  },
  {
    name: 'Ten-Thousand Triumph',
    description: 'Awarded for earning a monumental 10,000 points.',
    points: 10000,
    imageUrl: '/badges/milestone_10k.png',
  },
  {
    name: 'Point Pro',
    description: 'Awarded for achieving 25,000 lifetime points.',
    points: 25000,
    imageUrl: '/badges/milestone_25k.png',
  },
   {
    name: 'Fifty-Thousand Feat',
    description: 'Awarded for achieving 50,000 lifetime points.',
    points: 50000,
    imageUrl: '/badges/milestone_50k.png',
  },
  {
    name: 'Centurion of Credit',
    description: 'Awarded for the incredible achievement of 100,000 lifetime points.',
    points: 100000,
    imageUrl: '/badges/milestone_100k.png',
  },
];

export function MilestoneBadgeList() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {milestoneBadges.map((badge) => (
        <Card key={badge.name} className="text-center flex flex-col items-center p-4">
          <div className="w-24 h-24 relative mb-2">
            <Image 
                src={badge.imageUrl} 
                alt={badge.name} 
                width={96}
                height={96}
                data-ai-hint="golden trophy"
                className="mb-2"
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
