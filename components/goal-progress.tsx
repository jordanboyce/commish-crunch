'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Calendar, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoalProgressProps {
    currentCommission: number;
    monthlyGoal: number;
    industryName: string;
}

export default function GoalProgress({ currentCommission, monthlyGoal, industryName }: GoalProgressProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // If no goal is set, don't show the component
    if (!monthlyGoal || monthlyGoal <= 0) {
        return null;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Calculate progress percentage
    const progressPercentage = Math.min((currentCommission / monthlyGoal) * 100, 100);
    const remaining = Math.max(monthlyGoal - currentCommission, 0);

    // Calculate days in month and days remaining
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = now.getDate();
    const daysRemaining = daysInMonth - currentDay;
    const daysElapsed = currentDay;

    // Calculate expected progress based on days elapsed
    const expectedProgress = (daysElapsed / daysInMonth) * 100;

    // Calculate daily average needed to hit goal
    const dailyAverageNeeded = daysRemaining > 0 ? remaining / daysRemaining : 0;

    // Calculate projection based on current pace
    const currentDailyAverage = daysElapsed > 0 ? currentCommission / daysElapsed : 0;
    const projectedTotal = currentDailyAverage * daysInMonth;

    // Determine status
    const getStatus = () => {
        if (progressPercentage >= 100) {
            return {
                label: 'Goal Exceeded!',
                color: 'bg-green-500',
                textColor: 'text-green-700',
                badgeVariant: 'default' as const
            };
        } else if (progressPercentage >= expectedProgress) {
            return {
                label: 'On Track',
                color: 'bg-blue-500',
                textColor: 'text-blue-700',
                badgeVariant: 'default' as const
            };
        } else if (progressPercentage >= expectedProgress * 0.8) {
            return {
                label: 'Slightly Behind',
                color: 'bg-yellow-500',
                textColor: 'text-yellow-700',
                badgeVariant: 'secondary' as const
            };
        } else {
            return {
                label: 'Behind Pace',
                color: 'bg-orange-500',
                textColor: 'text-orange-700',
                badgeVariant: 'destructive' as const
            };
        }
    };

    const status = getStatus();

    // Get motivational message
    const getMessage = () => {
        if (progressPercentage >= 100) {
            const overBy = currentCommission - monthlyGoal;
            return `Amazing! You've exceeded your goal by ${formatCurrency(overBy)}! 🎉`;
        } else if (progressPercentage >= 90) {
            return `You're almost there! Just ${formatCurrency(remaining)} to go! 💪`;
        } else if (progressPercentage >= expectedProgress) {
            return `Great work! You're ahead of schedule! Keep it up! 🚀`;
        } else if (daysRemaining === 0) {
            return `Month ended. You earned ${formatCurrency(currentCommission)} toward your ${formatCurrency(monthlyGoal)} goal.`;
        } else {
            return `You need ${formatCurrency(dailyAverageNeeded)} per day to hit your goal.`;
        }
    };

    return (
        <Card className="border border-gray-200">
            <CardContent className="p-3">
                {/* Compact Header - Always Visible */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center gap-3 text-left"
                >
                    <Target className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-600">Goal</span>
                            <Badge variant={status.badgeVariant} className="text-xs py-0">
                                {progressPercentage.toFixed(0)}%
                            </Badge>
                        </div>
                        <Progress value={progressPercentage} className="h-1.5" />
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                        {/* Amount Progress */}
                        <div className="text-xs text-gray-600">
                            {formatCurrency(currentCommission)} of {formatCurrency(monthlyGoal)}
                        </div>

                        {/* Compact Stats Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-gray-50 rounded">
                                <div className="text-gray-500">Remaining</div>
                                <div className="font-medium">{formatCurrency(remaining)}</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded">
                                <div className="text-gray-500">Days Left</div>
                                <div className="font-medium">{daysRemaining}</div>
                            </div>
                            {daysRemaining > 0 && progressPercentage < 100 && (
                                <div className="p-2 bg-gray-50 rounded">
                                    <div className="text-gray-500">Daily Needed</div>
                                    <div className="font-medium">{formatCurrency(dailyAverageNeeded)}</div>
                                </div>
                            )}
                            <div className="p-2 bg-gray-50 rounded">
                                <div className="text-gray-500">Projection</div>
                                <div className={`font-medium ${projectedTotal >= monthlyGoal ? 'text-green-600' : 'text-orange-600'}`}>
                                    {formatCurrency(projectedTotal)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
