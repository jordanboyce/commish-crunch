'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sun,
  Lightbulb,
  Bug,
  Calculator,
  Zap,
  Heart,
  Shield,
  Clock
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const calculators = [
    {
      id: 'solar',
      name: 'Solar Sales',
      icon: Sun,
      available: true,
      description: 'Calculate solar panel installation commissions with pricing tiers, volume bonuses, and commission sharing.',
      features: ['Price per kW calculations', 'Redline penalties', 'Volume bonuses', 'Sales tracking']
    },
    {
      id: 'lighting',
      name: 'Permanent Lighting',
      icon: Lightbulb,
      available: false,
      description: 'Calculate commissions for permanent outdoor lighting sold by linear foot with tiered pricing and installation bonuses.',
      features: ['Price per linear foot', 'Tiered commission rates', 'Installation bonuses', 'Coming soon']
    },
    {
      id: 'pest',
      name: 'Pest Control',
      icon: Bug,
      available: false,
      description: 'Calculate commissions for pest control services, recurring contracts, and one-time treatments.',
      features: ['Service tiers', 'Contract bonuses', 'Recurring revenue', 'Coming soon']
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-4 mb-6">
          <Calculator className="h-16 w-16 text-gray-700" />
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-2">CommishCrunch</h1>
            <p className="text-xl text-gray-600">No-BS Commission Calculators for Sales Pros</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <p className="text-lg text-gray-700 mb-6">
            Tired of complicated spreadsheets and confusing commission structures?
            Get instant, accurate commission calculations for your sales with zero hassle.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              No accounts required
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Works offline
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Lightning fast
            </div>
          </div>
        </div>
      </div>

      {/* Calculator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calculators.map((calc) => {
          const IconComponent = calc.icon;

          return (
            <Card
              key={calc.id}
              className={`relative transition-all duration-200 ${calc.available
                ? 'hover:shadow-lg hover:scale-105 cursor-pointer border-2 hover:border-gray-300'
                : 'opacity-60'
                }`}
              onClick={() => calc.available && router.push(`/${calc.id}`)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <IconComponent className={`h-8 w-8 ${calc.available ? 'text-gray-700' : 'text-gray-400'
                    }`} />
                  {!calc.available && (
                    <Badge variant="secondary">Coming Soon</Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{calc.name}</CardTitle>
                <CardDescription className="text-sm">
                  {calc.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {calc.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="h-1.5 w-1.5 bg-gray-400 rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  disabled={!calc.available}
                  onClick={(e) => {
                    e.stopPropagation();
                    calc.available && router.push(`/${calc.id}`);
                  }}
                >
                  {calc.available ? 'Launch Calculator' : 'Coming Soon'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
          <span>Built with</span>
          <Heart className="h-4 w-4 text-red-500" />
          <span>by</span>
          <strong><a href="https://cyberlion.dev" target='_blank'>Cyberlion Web Solutions</a></strong>
        </div>
        <p className="text-sm text-gray-500">
          Simple tools for sales professionals. No accounts, no tracking, just results.
        </p>
      </div>
    </div>
  );
}