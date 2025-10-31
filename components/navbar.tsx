'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sun,
  Lightbulb,
  Bug,
  Calculator
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const calculators = [
    {
      id: 'home',
      name: 'Home',
      icon: Calculator,
      available: true,
      description: 'Calculator selection page'
    },
    {
      id: 'solar',
      name: 'Solar Sales',
      icon: Sun,
      available: true,
      description: 'Solar panel commission calculator'
    },
    {
      id: 'lighting',
      name: 'Permanent Lighting',
      icon: Lightbulb,
      available: true,
      description: 'Linear foot pricing commission calculator'
    },
    {
      id: 'pest',
      name: 'Pest Control',
      icon: Bug,
      available: false,
      description: 'Pest control service calculator'
    }
  ];

  // Determine current calculator from pathname
  const getCurrentCalculator = () => {
    if (pathname === '/solar' || pathname === '/solar/') return 'solar';
    if (pathname === '/lighting' || pathname === '/lighting/') return 'lighting';
    if (pathname === '/pest' || pathname === '/pest/') return 'pest';
    return 'home';
  };

  const currentCalculator = getCurrentCalculator();

  console.log('Current pathname:', pathname);
  console.log('Current calculator:', currentCalculator);

  const handleCalculatorChange = (calculatorId: string) => {
    console.log('Navigating to:', calculatorId); // Debug log
    if (calculatorId === 'home') {
      router.push('/');
    } else {
      router.push(`/${calculatorId}`);
    }
  };

  const handleHomeClick = () => {
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleHomeClick}
          >
            <Calculator className="h-8 w-8 text-gray-700" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">CommishCrunch</h1>
              <p className="text-xs text-gray-500 hidden sm:block">No-BS commission calculators for sales pros</p>
            </div>
          </div>

          {/* Calculator Dropdown */}
          <div className="flex items-center gap-3">
            {/* <div className="flex items-center gap-2 text-sm text-gray-600">
              <CurrentIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Calculator:</span>
            </div> */}
            <Select value={currentCalculator} onValueChange={handleCalculatorChange}>
              <SelectTrigger className="w-50">
                <SelectValue placeholder="Select Calculator" />
              </SelectTrigger>
              <SelectContent>
                {calculators.map((calc) => {
                  const IconComponent = calc.icon;
                  console.log('SelectItem value:', calc.id, 'name:', calc.name);
                  return (
                    <SelectItem
                      key={calc.id}
                      value={calc.id}
                      className="flex items-center gap-2"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <IconComponent className="h-4 w-4" />
                        <span className="flex-1">{calc.name}</span>
                        {!calc.available && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            Soon
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </nav>
  );
}