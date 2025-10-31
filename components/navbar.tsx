'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sun, 
  Lightbulb, 
  Bug, 
  Calculator,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentCalculator?: string;
  onCalculatorChange?: (calculator: string) => void;
  onHomeClick?: () => void;
}

export default function Navbar({ currentCalculator = 'solar', onCalculatorChange, onHomeClick }: NavbarProps) {
  const calculators = [
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
      available: false,
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

  const currentCalc = calculators.find(calc => calc.id === currentCalculator);
  const CurrentIcon = currentCalc?.icon || Calculator;

  const handleCalculatorChange = (calculatorId: string) => {
    const calc = calculators.find(c => c.id === calculatorId);
    if (calc?.available && onCalculatorChange) {
      onCalculatorChange(calculatorId);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onHomeClick}
          >
            <Calculator className="h-8 w-8 text-gray-700" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">CommishCrunch</h1>
              <p className="text-xs text-gray-500 hidden sm:block">No-BS commission calculators for sales pros</p>
            </div>
          </div>

          {/* Calculator Dropdown */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CurrentIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Calculator:</span>
            </div>
            <Select value={currentCalculator} onValueChange={handleCalculatorChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {calculators.map((calc) => {
                  const IconComponent = calc.icon;
                  return (
                    <SelectItem 
                      key={calc.id} 
                      value={calc.id}
                      disabled={!calc.available}
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