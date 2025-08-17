
'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';

const milestoneBadges = [
  {
    name: 'Intern of Incentives',
    description: 'Awarded for earning your first 200 points.',
    points: 50,
    imageUrl: '/intern-of-incentives.png',
    hint: 'backpack trophy',
  },
  {
    name: 'Point Pioneer',
    description: 'Awarded for earning your first 1,000 points.',
    points: 100,
    imageUrl: '/PointPioneer.png',
    hint: 'covered wagon',
  },
  {
    name: 'Five-Star Finisher',
    description: 'Awarded for earning a total of 5,000 points.',
    points: 500,
    imageUrl: '/five-star-finisher.png',
    hint: 'silver medal',
  },
  {
    name: 'Ten-Thousand Triumph',
    description: 'Awarded for earning a monumental 10,000 points.',
    points: 100,
    imageUrl: '/tenthousand.png',
    hint: 'gold medal',
  },
  {
    name: 'Point Pro',
    description: 'Awarded for achieving 25,000 lifetime points.',
    points: 100,
    imageUrl: '/point_pro.png',
    hint: 'platinum trophy',
  },
   {
    name: 'Fifty-Thousand Feat',
    description: 'Awarded for achieving 50,000 lifetime points.',
    points: 500,
    imageUrl: '/fiftythousand.png',
    hint: 'diamond trophy',
  },
  {
    name: 'CEO of Collection',
    description: 'Awarded for the incredible achievement of 100,000 lifetime points.',
    points: 100000,
    imageUrl: '/hundredthou.png',
    hint: 'glowing award',
  },
  {
    name: 'Photogenic',
    description: 'Awarded for uploading a profile picture.',
    points: 300,
    imageUrl: '/photogenic.png',
    hint: 'camera shutter',
  },
];

export function MilestoneBadgeList() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {milestoneBadges.map((badge) => (
        <Card key={badge.name} className="text-center flex flex-col items-center p-3">
          <div className="w-20 h-20 relative mb-2 flex items-center justify-center">
              <Image 
                  src={badge.imageUrl} 
                  alt={badge.name} 
                  width={80}
                  height={80}
                  data-ai-hint={badge.hint}
                  unoptimized={badge.imageUrl.startsWith('/')}
              />
           </div>
          <h3 className="font-semibold text-sm leading-tight">{badge.name}</h3>
          <p className="text-sm font-bold text-primary mt-1">{badge.points.toLocaleString()} Points</p>
          <p className="text-xs text-muted-foreground mt-1 px-1">{badge.description}</p>
        </Card>
      ))}
    </div>
  );
}
