import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Wrench } from 'lucide-react';

export default function LightingPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Lightbulb className="h-12 w-12 text-gray-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Permanent Lighting Calculator</CardTitle>
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