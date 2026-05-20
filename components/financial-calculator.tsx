'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Landmark, Calculator, DollarSign, Settings, History, Save, Download, Upload, X, RotateCcw } from 'lucide-react';
import SalesTracker from './sales-tracker';
import GoalProgress from './goal-progress';
import { salesDB, SaleRecord } from '@/lib/sales-db';
import { settingsDB } from '@/lib/settings-db';

interface CommissionBreakdown {
    label: string;
    amount: number;
    type: 'base' | 'bonus' | 'penalty' | 'shared';
}

export default function FinancialCalculator() {
    const [assetValue, setAssetValue] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [flatFee, setFlatFee] = useState('');
    const [showSettingsReminder, setShowSettingsReminder] = useState(false);

    // Company settings with IndexedDB persistence
    const [aumRate, setAumRate] = useState(1.00); // 1% AUM fee
    const [minAssetThreshold, setMinAssetThreshold] = useState(10000); // $10k minimum for AUM

    // Tiered settings
    const [hasTiers, setHasTiers] = useState(false);
    const [tier1Threshold, setTier1Threshold] = useState(500000); // First $500k
    const [tier1Rate, setTier1Rate] = useState(1.00);
    const [tier2Rate, setTier2Rate] = useState(0.75);

    // Commission sharing settings
    const [isSharedCommission, setIsSharedCommission] = useState(false);
    const [sharedPercentage, setSharedPercentage] = useState(50);
    const [sharingReason, setSharingReason] = useState('Split with partner');

    // Goal tracking
    const [monthlyGoal, setMonthlyGoal] = useState(0);
    const [currentMonthCommission, setCurrentMonthCommission] = useState(0);

    const [result, setResult] = useState<{
        totalCommission: number;
        breakdown: CommissionBreakdown[];
        assetValue: number;
        grossCommission: number;
    } | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedSettings = await settingsDB.getSettings('financial');
                if (savedSettings) {
                    setAumRate(savedSettings.aumRate || 1.00);
                    setMinAssetThreshold(savedSettings.minAssetThreshold || 10000);
                    setHasTiers(savedSettings.hasTiers || false);
                    setTier1Threshold(savedSettings.tier1Threshold || 500000);
                    setTier1Rate(savedSettings.tier1Rate || 1.00);
                    setTier2Rate(savedSettings.tier2Rate || 0.75);
                    setIsSharedCommission(savedSettings.isSharedCommission || false);
                    setSharedPercentage(savedSettings.sharedPercentage || 50);
                    setSharingReason(savedSettings.sharingReason || 'Split with partner');
                    setMonthlyGoal(savedSettings.monthlyGoal || 0);
                }

                const reminderDismissed = localStorage.getItem('financialSettingsReminderDismissed');
                if (!reminderDismissed && !savedSettings) {
                    setShowSettingsReminder(true);
                }
            } catch (error) {
                console.error('Error loading saved settings:', error);
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        const saveSettings = async () => {
            const settings = {
                aumRate,
                minAssetThreshold,
                hasTiers,
                tier1Threshold,
                tier1Rate,
                tier2Rate,
                isSharedCommission,
                sharedPercentage,
                sharingReason,
                monthlyGoal
            };
            try {
                await settingsDB.saveSettings('financial', settings);
            } catch (error) {
                console.error('Error saving settings:', error);
            }
        };
        saveSettings();
    }, [aumRate, minAssetThreshold, hasTiers, tier1Threshold, tier1Rate, tier2Rate, isSharedCommission, sharedPercentage, sharingReason, monthlyGoal]);

    useEffect(() => {
        const calculateMonthlyCommission = async () => {
            try {
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const financialSales = await salesDB.getSalesByIndustry('financial');

                const thisMonthCompletedSales = financialSales.filter(sale => {
                    const saleDate = new Date(sale.dateCreated);
                    return saleDate.getMonth() === currentMonth &&
                        saleDate.getFullYear() === currentYear &&
                        sale.status === 'completed';
                });

                const totalCommission = thisMonthCompletedSales.reduce((sum, sale) => sum + sale.commission, 0);
                setCurrentMonthCommission(totalCommission);
            } catch (error) {
                console.error('Error calculating monthly commission:', error);
            }
        };

        calculateMonthlyCommission();
        const interval = setInterval(calculateMonthlyCommission, 10000);
        return () => clearInterval(interval);
    }, []);

    const calculateCommission = () => {
        const assets = parseFloat(assetValue) || 0;
        const fee = parseFloat(flatFee) || 0;

        if (assets < minAssetThreshold && fee === 0) {
            setResult(null);
            return;
        }

        let aumCommission = 0;
        const breakdown: CommissionBreakdown[] = [];

        if (hasTiers) {
            const tier1Amount = Math.min(assets, tier1Threshold);
            const tier2Amount = Math.max(0, assets - tier1Threshold);
            const tier1Commission = tier1Amount * (tier1Rate / 100);
            const tier2Commission = tier2Amount * (tier2Rate / 100);
            aumCommission = tier1Commission + tier2Commission;

            if (tier1Amount > 0) {
                breakdown.push({
                    label: `Tier 1 (${tier1Rate}% of $${tier1Amount.toLocaleString()})`,
                    amount: tier1Commission,
                    type: 'base'
                });
            }
            if (tier2Amount > 0) {
                breakdown.push({
                    label: `Tier 2 (${tier2Rate}% of $${tier2Amount.toLocaleString()})`,
                    amount: tier2Commission,
                    type: 'base'
                });
            }
        } else {
            aumCommission = assets * (aumRate / 100);
            if (aumCommission > 0) {
                breakdown.push({
                    label: `AUM Commission (${aumRate}% of $${assets.toLocaleString()})`,
                    amount: aumCommission,
                    type: 'base'
                });
            }
        }

        if (fee > 0) {
            breakdown.push({ label: 'Flat / Product Fee', amount: fee, type: 'bonus' });
        }

        const grossCommission = aumCommission + fee;
        let totalCommission = grossCommission;

        if (isSharedCommission) {
            const shareAmount = grossCommission * (sharedPercentage / 100);
            breakdown.push({
                label: `${sharingReason} (${sharedPercentage}%)`,
                amount: shareAmount,
                type: 'shared'
            });
            totalCommission -= shareAmount;
        }

        setResult({
            totalCommission: Math.max(0, totalCommission),
            breakdown,
            assetValue: assets,
            grossCommission
        });
    };

    const handleSaveSale = async () => {
        if (!result) return;

        try {
            const saleData: Omit<SaleRecord, 'id' | 'dateCreated'> = {
                industry: 'financial',
                customerName: customerName || 'Unknown Client',
                saleAmount: result.assetValue,
                commission: result.totalCommission,
                status: 'pending',
                notes: `Commission breakdown: ${result.breakdown.map(b => `${b.label}: ${formatCurrency(b.amount)}`).join(', ')}`,
                industryData: {
                    assetValue: result.assetValue,
                    flatFee: parseFloat(flatFee) || 0,
                    aumRate,
                    minAssetThreshold,
                    hasTiers,
                    tier1Threshold,
                    tier1Rate,
                    tier2Rate
                }
            };

            await salesDB.addSale(saleData);

            setCustomerName('');
            setAssetValue('');
            setFlatFee('');
            setResult(null);

            alert('Sale saved successfully!');
        } catch (error) {
            console.error('Error saving sale:', error);
            alert('Error saving sale. Please try again.');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getAssetStatus = () => {
        const assets = parseFloat(assetValue);
        if (!assets || assets < minAssetThreshold) {
            return { color: 'red', text: 'Below Minimum' };
        }
        return { color: 'green', text: 'Qualifies' };
    };

    const dismissSettingsReminder = () => {
        setShowSettingsReminder(false);
        localStorage.setItem('financialSettingsReminderDismissed', 'true');
    };

    const handleExportData = async () => {
        try {
            const [settings, sales] = await Promise.all([
                settingsDB.getSettings('financial'),
                salesDB.getSalesByIndustry('financial')
            ]);

            const exportData = {
                version: '1.0',
                industry: 'financial',
                exportDate: new Date().toISOString(),
                settings: settings || {},
                sales: sales || []
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `commishcrunch-financial-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('Data exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            alert('Error exporting data. Please try again.');
        }
    };

    const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            if (!importData.version || !importData.industry || importData.industry !== 'financial') {
                alert('Invalid backup file. Please select a valid CommishCrunch financial backup file.');
                return;
            }

            const confirmImport = confirm(
                `Import data from ${new Date(importData.exportDate).toLocaleDateString()}?\n\n` +
                `This will merge:\n` +
                `- Settings: ${Object.keys(importData.settings || {}).length} items\n` +
                `- Sales: ${(importData.sales || []).length} records\n\n` +
                `Existing data will be preserved.`
            );

            if (!confirmImport) return;

            if (importData.settings) {
                await settingsDB.saveSettings('financial', importData.settings);

                setAumRate(importData.settings.aumRate || aumRate);
                setMinAssetThreshold(importData.settings.minAssetThreshold || minAssetThreshold);
                setHasTiers(importData.settings.hasTiers || hasTiers);
                setTier1Threshold(importData.settings.tier1Threshold || tier1Threshold);
                setTier1Rate(importData.settings.tier1Rate || tier1Rate);
                setTier2Rate(importData.settings.tier2Rate || tier2Rate);
                setIsSharedCommission(importData.settings.isSharedCommission || isSharedCommission);
                setSharedPercentage(importData.settings.sharedPercentage || sharedPercentage);
                setSharingReason(importData.settings.sharingReason || sharingReason);
            }

            if (importData.sales && Array.isArray(importData.sales)) {
                for (const sale of importData.sales) {
                    await salesDB.addSale({
                        industry: 'financial',
                        customerName: sale.customerName,
                        saleAmount: sale.saleAmount,
                        commission: sale.commission,
                        status: sale.status,
                        notes: sale.notes,
                        industryData: sale.industryData || {}
                    });
                }
            }

            alert(`Import successful!\nImported ${Object.keys(importData.settings || {}).length} settings and ${(importData.sales || []).length} sales records.`);

            event.target.value = '';
        } catch (error) {
            console.error('Import error:', error);
            alert('Error importing data. Please check the file format and try again.');
            event.target.value = '';
        }
    };

    const resetToDefaults = async () => {
        const confirmReset = confirm(
            'Reset all settings to default values?\n\n' +
            'This will restore:\n' +
            '• AUM Rate: 1.00%\n' +
            '• Min Asset Threshold: $10,000\n' +
            '• Tiered Pricing: Disabled\n' +
            '• Commission Sharing: Disabled\n\n' +
            'Your sales history will not be affected.'
        );

        if (confirmReset) {
            try {
                setAumRate(1.00);
                setMinAssetThreshold(10000);
                setHasTiers(false);
                setTier1Threshold(500000);
                setTier1Rate(1.00);
                setTier2Rate(0.75);
                setIsSharedCommission(false);
                setSharedPercentage(50);
                setSharingReason('Split with partner');
                setMonthlyGoal(0);

                await settingsDB.saveSettings('financial', {
                    aumRate: 1.00,
                    minAssetThreshold: 10000,
                    hasTiers: false,
                    tier1Threshold: 500000,
                    tier1Rate: 1.00,
                    tier2Rate: 0.75,
                    isSharedCommission: false,
                    sharedPercentage: 50,
                    sharingReason: 'Split with partner',
                    monthlyGoal: 0
                });

                alert('Settings reset to default values successfully!');
            } catch (error) {
                console.error('Error resetting settings:', error);
                alert('Error resetting settings. Please try again.');
            }
        }
    };

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Landmark className="h-8 w-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Financial Advisor Calculator</h1>
                </div>
                <p className="text-gray-600">Calculate your advisory commission with precision</p>
            </div>

            <Tabs defaultValue="calculator" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="calculator" className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Calculator
                    </TabsTrigger>
                    <TabsTrigger value="tracker" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Sales Tracker
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="calculator" className="space-y-6">
                    {/* Settings Reminder */}
                    {showSettingsReminder && (
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="font-medium text-blue-900 mb-1">First time using this calculator?</h4>
                                        <p className="text-sm text-blue-800">
                                            Make sure to check the <strong>Settings tab</strong> to configure your AUM rate, minimum asset threshold, and tier structure.
                                            These numbers affect your commission calculation.
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={dismissSettingsReminder}
                                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Input Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Client Details
                            </CardTitle>
                            <CardDescription>
                                Enter your client's asset and fee information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="customerName">Client Name (Optional)</Label>
                                    <Input
                                        id="customerName"
                                        placeholder="John Smith"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="text-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="assetValue">Assets Under Management ($)</Label>
                                    <Input
                                        id="assetValue"
                                        type="number"
                                        step="1000"
                                        placeholder="500000"
                                        value={assetValue}
                                        onChange={(e) => setAssetValue(e.target.value)}
                                        className="text-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="flatFee">Flat / Product Fee ($)</Label>
                                    <Input
                                        id="flatFee"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={flatFee}
                                        onChange={(e) => setFlatFee(e.target.value)}
                                        className="text-lg"
                                    />
                                </div>
                            </div>

                            {/* Project info display */}
                            {(assetValue || flatFee) && (
                                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                                    {assetValue && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Assets Under Management:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{formatCurrency(parseFloat(assetValue))}</span>
                                                    <Badge variant={
                                                        getAssetStatus().color === 'green' ? 'default' : 'destructive'
                                                    }>
                                                        {getAssetStatus().text}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Pricing Model:</span>
                                                <span className="font-medium">{hasTiers ? 'Tiered' : `Flat ${aumRate}%`}</span>
                                            </div>
                                        </>
                                    )}
                                    {flatFee && parseFloat(flatFee) > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Additional Fees:</span>
                                            <span className="font-medium">{formatCurrency(parseFloat(flatFee))}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    onClick={calculateCommission}
                                    className="flex-1"
                                    disabled={!assetValue && !flatFee}
                                >
                                    Calculate Commission
                                </Button>

                                {result && (
                                    <Button
                                        onClick={handleSaveSale}
                                        variant="outline"
                                        className="flex items-center gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        Save Sale
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results Card */}
                    {result && (
                        <Card className="bg-green-50 border-green-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-800">
                                    <DollarSign className="h-5 w-5" />
                                    Commission Results
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Total Commission */}
                                <div className="text-center p-6 bg-white rounded-lg">
                                    <div className="text-3xl font-bold text-green-600 mb-2">
                                        {formatCurrency(result.totalCommission)}
                                    </div>
                                    <div className="text-gray-600">Your Commission</div>
                                    {isSharedCommission && (
                                        <div className="text-sm text-gray-500 mt-1">
                                            (After {sharedPercentage}% sharing)
                                        </div>
                                    )}
                                </div>

                                {/* Sale Summary */}
                                <div className="p-4 bg-white rounded-lg space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Assets Under Management:</span>
                                        <span className="font-medium">{formatCurrency(result.assetValue)}</span>
                                    </div>
                                    {parseFloat(flatFee) > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Flat / Product Fee:</span>
                                            <span className="font-medium">{formatCurrency(parseFloat(flatFee))}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Gross Commission:</span>
                                        <span className="font-medium">{formatCurrency(result.grossCommission)}</span>
                                    </div>
                                </div>

                                {/* Breakdown */}
                                <div className="space-y-2">
                                    {result.breakdown.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                                            <span className="flex items-center gap-2">
                                                {item.label}
                                                <Badge variant={
                                                    item.type === 'bonus' ? 'default' :
                                                        item.type === 'penalty' ? 'destructive' :
                                                            item.type === 'shared' ? 'outline' : 'secondary'
                                                }>
                                                    {item.type}
                                                </Badge>
                                            </span>
                                            <span className={`font-medium ${item.type === 'penalty' || item.type === 'shared' ? 'text-red-600' : 'text-green-600'
                                                }`}>
                                                {item.type === 'penalty' || item.type === 'shared' ? '-' : '+'}{formatCurrency(item.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Goal Progress - Bottom of page */}
                    <GoalProgress
                        currentCommission={currentMonthCommission}
                        monthlyGoal={monthlyGoal}
                        industryName="Financial Advisor"
                    />
                </TabsContent>

                <TabsContent value="tracker" className="space-y-6">
                    <SalesTracker industry="financial" />
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    {/* Goal Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Monthly Goal Settings
                                <Badge variant="outline" className="text-xs">
                                    Auto-saved
                                </Badge>
                            </CardTitle>
                            <CardDescription>Set your monthly commission goal to track progress and stay motivated.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="monthlyGoal">Monthly Commission Goal ($)</Label>
                                <Input
                                    id="monthlyGoal"
                                    type="number"
                                    step="100"
                                    min="0"
                                    placeholder="10000"
                                    value={monthlyGoal || ''}
                                    onChange={(e) => setMonthlyGoal(parseFloat(e.target.value) || 0)}
                                />
                                <p className="text-xs text-gray-500">
                                    Set a monthly commission goal to see your progress on the Calculator tab. Leave at $0 to disable goal tracking.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AUM & Commission Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                AUM & Commission Settings
                                <Badge variant="outline" className="text-xs">
                                    Auto-saved
                                </Badge>
                            </CardTitle>
                            <CardDescription>Configure your firm's AUM rate and minimum asset threshold. Settings are automatically saved.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="aumRate">Standard AUM Rate (%)</Label>
                                    <Input
                                        id="aumRate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={aumRate}
                                        onChange={(e) => setAumRate(parseFloat(e.target.value) || 0)}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Annual fee charged on assets under management (1.00% is industry standard)
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="minAssetThreshold">Minimum Asset Threshold ($)</Label>
                                    <Input
                                        id="minAssetThreshold"
                                        type="number"
                                        step="1000"
                                        min="0"
                                        value={minAssetThreshold}
                                        onChange={(e) => setMinAssetThreshold(parseFloat(e.target.value) || 0)}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Minimum AUM required before AUM commission applies
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tiered Pricing Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Tiered Pricing Settings
                                <Badge variant="outline" className="text-xs">
                                    Auto-saved
                                </Badge>
                            </CardTitle>
                            <CardDescription>Use a different AUM rate for assets above a threshold (e.g. 1% on first $500k, 0.75% above).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="hasTiers"
                                    checked={hasTiers}
                                    onCheckedChange={setHasTiers}
                                />
                                <Label htmlFor="hasTiers" className="font-medium">Enable tiered pricing</Label>
                            </div>

                            {hasTiers && (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="space-y-2">
                                        <Label htmlFor="tier1Threshold">Tier 1 Threshold ($)</Label>
                                        <Input
                                            id="tier1Threshold"
                                            type="number"
                                            step="1000"
                                            min="0"
                                            value={tier1Threshold}
                                            onChange={(e) => setTier1Threshold(parseFloat(e.target.value) || 0)}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Assets up to this amount use the Tier 1 rate; anything above uses Tier 2
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="tier1Rate">Tier 1 Rate (%)</Label>
                                            <Input
                                                id="tier1Rate"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={tier1Rate}
                                                onChange={(e) => setTier1Rate(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tier2Rate">Tier 2 Rate (%)</Label>
                                            <Input
                                                id="tier2Rate"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={tier2Rate}
                                                onChange={(e) => setTier2Rate(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Commission Sharing Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Commission Sharing
                                <Badge variant="outline" className="text-xs">
                                    Auto-saved
                                </Badge>
                            </CardTitle>
                            <CardDescription>Configure commission sharing with partners or team members. Settings are automatically saved.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isSharedCommission"
                                    checked={isSharedCommission}
                                    onCheckedChange={setIsSharedCommission}
                                />
                                <Label htmlFor="isSharedCommission">Enable commission sharing</Label>
                            </div>

                            {isSharedCommission && (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="sharedPercentage">Shared Percentage (%)</Label>
                                            <Input
                                                id="sharedPercentage"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={sharedPercentage}
                                                onChange={(e) => setSharedPercentage(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sharingReason">Sharing Reason</Label>
                                            <Input
                                                id="sharingReason"
                                                type="text"
                                                placeholder="e.g., Split with partner"
                                                value={sharingReason}
                                                onChange={(e) => setSharingReason(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Data Export/Import */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Move Your Data Between Devices</CardTitle>
                            <CardDescription>
                                Save your commission settings and sales history to use on your phone, laptop, or share with your team.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-lg mb-4">
                                <h4 className="font-medium text-blue-900 mb-2">Why backup your data?</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Use the same settings on your phone and computer</li>
                                    <li>• Share your firm's commission structure with teammates</li>
                                    <li>• Keep your sales history safe if you clear your browser</li>
                                    <li>• Set up new devices quickly with your existing data</li>
                                </ul>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Button onClick={handleExportData} variant="outline" className="w-full flex items-center gap-2">
                                        <Download className="h-4 w-4" />
                                        Download Backup File
                                    </Button>
                                    <p className="text-xs text-gray-600">
                                        Saves all your settings and sales to a file
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="relative">
                                        <Input
                                            type="file"
                                            accept=".json"
                                            onChange={handleImportData}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            id="import-file"
                                        />
                                        <Button variant="outline" className="w-full flex items-center gap-2" asChild>
                                            <label htmlFor="import-file" className="cursor-pointer">
                                                <Upload className="h-4 w-4" />
                                                Upload Backup File
                                            </label>
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        Restore from a previously saved backup
                                    </p>
                                </div>
                            </div>

                            <div className="p-3 bg-gray-50 rounded text-xs text-gray-600">
                                <strong>How it works:</strong> Export creates a file you can save anywhere.
                                Import loads that file on any device. Your existing data stays safe - we only add the imported data.
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reset Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Reset Settings</CardTitle>
                            <CardDescription>
                                Reset all commission settings back to default values if you need to start fresh.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-orange-900 mb-1">Restore Default Settings</h4>
                                    <p className="text-sm text-orange-800">
                                        This will reset AUM rate, thresholds, tiers, and sharing settings to defaults.
                                        Your sales history will not be affected.
                                    </p>
                                </div>
                                <Button
                                    onClick={resetToDefaults}
                                    variant="outline"
                                    className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-100"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Reset to Defaults
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
