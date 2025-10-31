'use client';

import { useState } from 'react';
import Navbar from './navbar';
import HomePage from './home-page';
import SimpleSolarCalculator from './simple-solar-calculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Bug, Wrench } from 'lucide-react';

export default function AppLayout() {
  const [currentView, setCurrentView] = useState('home'); // 'home' or calculator id

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <HomePage onCalculatorSelect={setCurrentView} />;
      case 'solar':
        return <SimpleSolarCalculator />;
      case 'lighting':
        return <ComingSoonCard title="Permanent Lighting Calculator" icon={Lightbulb} />;
      case 'pest':
        return <ComingSoonCard title="Pest Control Calculator" icon={Bug} />;
      default:
        return <HomePage onCalculatorSelect={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      <Navbar 
        currentCalculator={currentView === 'home' ? 'solar' : currentView} 
        onCalculatorChange={setCurrentView}
        onHomeClick={() => setCurrentView('home')}
      />
      <div className="container mx-auto px-4 py-6">
        {renderContent()}
      </div>
    </div>
  );
}

function ComingSoonCard({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Icon className="h-12 w-12 text-gray-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>
            This calculator is currently under development and will be available soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Wrench className="h-4 w-4" />
            Coming Soon
          </div>
          <p className="mt-4 text-sm text-gray-600">
            We're working hard to bring you commission calculators for multiple industries. 
            Check back soon for updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}