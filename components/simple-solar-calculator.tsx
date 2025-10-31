'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Sun, Calculator, DollarSign, Settings, History, Save, Download, Upload } from 'lucide-react';
import SalesTracker from './sales-tracker';
import { salesDB, SaleRecord } from '@/lib/sales-db';
import { settingsDB } from '@/lib/settings-db';

interface CommissionBreakdown {
    label: string;
    amount: number;
    type: 'base' | 'bonus' | 'penalty' | 'shared';
}

export default function SimpleSolarCalculator() {
    const [systemSize, setSystemSize] = useState('');
    const [customerName, setCustomerName] = useState('');

    // Company settings with localStorage persistence
    const [pricePerKw, setPricePerKw] = useState(3.20);
    const [baseRate, setBaseRate] = useState(3.5);
    const [redlinePrice, setRedlinePrice] = useState(2.80);


    // Volume bonus settings
    const [hasVolumeBonus, setHasVolumeBonus] = useState(false);
    const [volumeThreshold, setVolumeThreshold] = useState(10);
    const [volumeBonusRate, setVolumeBonusRate] = useState(0.5);

    // Commission sharing settings
    const [isSharedCommission, setIsSharedCommission] = useState(false);
    const [sharedPercentage, setSharedPercentage] = useState(50);
    const [sharingReason, setSharingReason] = useState('Split with setter');

    const [result, setResult] = useState<{
        totalCommission: number;
        breakdown: CommissionBreakdown[];
        pricePerKw: number;
        saleAmount: number;
        grossCommission: number;
    } | null>(null);

    // Load settings from IndexedDB on component mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedSettings = await settingsDB.getSettings('solar');
                if (savedSettings) {
                    setPricePerKw(savedSettings.pricePerKw || 3.20);
                    setBaseRate(savedSettings.baseRate || 3.5);
                    setRedlinePrice(savedSettings.redlinePrice || 2.80);
                    setHasVolumeBonus(savedSettings.hasVolumeBonus || false);
                    setVolumeThreshold(savedSettings.volumeThreshold || 10);
                    setVolumeBonusRate(savedSettings.volumeBonusRate || 0.5);
                    setIsSharedCommission(savedSettings.isSharedCommission || false);
                    setSharedPercentage(savedSettings.sharedPercentage || 50);
                    setSharingReason(savedSettings.sharingReason || 'Split with partner');
                }
            } catch (error) {
                console.error('Error loading saved settings:', error);
            }
        };
        loadSettings();
    }, []);

    // Save settings to IndexedDB whenever they change
    useEffect(() => {
        const saveSettings = async () => {
            const settings = {
                pricePerKw,
                baseRate,
                redlinePrice,
                hasVolumeBonus,
                volumeThreshold,
                volumeBonusRate,
                isSharedCommission,
                sharedPercentage,
                sharingReason
            };
            try {
                await settingsDB.saveSettings('solar', settings);
            } catch (error) {
                console.error('Error saving settings:', error);
            }
        };
        saveSettings();
    }, [pricePerKw, baseRate, redlinePrice, hasVolumeBonus, volumeThreshold, volumeBonusRate, isSharedCommission, sharedPercentage, sharingReason]);

    const calculateCommission = async () => {
        const size = parseFloat(systemSize);

        if (!size) return;

        const saleAmount = size * pricePerKw;
        const breakdown: CommissionBreakdown[] = [];

        // Base commission
        const baseCommission = saleAmount * (baseRate / 100);
        breakdown.push({
            label: 'Base Commission',
            amount: baseCommission,
            type: 'base'
        });

        let totalCommission = baseCommission;

        // Volume bonus check
        if (hasVolumeBonus) {
            try {
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const solarSales = await salesDB.getSalesByIndustry('solar');

                const thisMonthSales = solarSales.filter(sale => {
                    const saleDate = new Date(sale.dateCreated);
                    return saleDate.getMonth() === currentMonth &&
                        saleDate.getFullYear() === currentYear &&
                        sale.status === 'completed';
                });

                if (thisMonthSales.length >= volumeThreshold) {
                    const volumeBonus = saleAmount * (volumeBonusRate / 100);
                    breakdown.push({
                        label: `Volume Bonus (${thisMonthSales.length}/${volumeThreshold} sales)`,
                        amount: volumeBonus,
                        type: 'bonus'
                    });
                    totalCommission += volumeBonus;
                }
            } catch (error) {
                console.error('Error checking volume bonus:', error);
            }
        }



        // Redline penalty
        if (pricePerKw < redlinePrice) {
            const penalty = totalCommission * 0.5;
            breakdown.push({
                label: 'Below Redline Penalty',
                amount: penalty,
                type: 'penalty'
            });
            totalCommission -= penalty;
        }



        // Commission sharing
        let finalCommission = totalCommission;
        if (isSharedCommission) {
            const sharedAmount = totalCommission * (sharedPercentage / 100);
            breakdown.push({
                label: `${sharingReason} (${sharedPercentage}%)`,
                amount: sharedAmount,
                type: 'shared'
            });
            finalCommission = totalCommission - sharedAmount;
        }

        setResult({
            totalCommission: Math.max(0, finalCommission),
            breakdown,
            pricePerKw,
            saleAmount,
            grossCommission: totalCommission
        });
    };

    const handleSaveSale = async () => {
        if (!result || !systemSize) return;

        try {
            const saleData: Omit<SaleRecord, 'id' | 'dateCreated'> = {
                industry: 'solar',
                customerName: customerName || 'Unknown Customer',
                saleAmount: result.saleAmount,
                commission: result.totalCommission,
                status: 'pending',
                notes: `Commission breakdown: ${result.breakdown.map(b => `${b.label}: ${formatCurrency(b.amount)}`).join(', ')}`,
                industryData: {
                    systemSize: parseFloat(systemSize),
                    pricePerKw: result.pricePerKw,
                    baseRate,
                    redlinePrice,
                    hasVolumeBonus,
                    volumeThreshold,
                    volumeBonusRate
                }
            };

            await salesDB.addSale(saleData);

            // Reset form
            setSystemSize('');
            setCustomerName('');
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

    const getPriceStatus = () => {
        if (pricePerKw < redlinePrice) return { color: 'red', text: 'Below Redline' };
        return { color: 'green', text: 'Good Price' };
    };

    const handleExportData = async () => {
        try {
            // Get all solar settings and sales
            const [settings, sales] = await Promise.all([
                settingsDB.getSettings('solar'),
                salesDB.getSalesByIndustry('solar')
            ]);

            const exportData = {
                version: '1.0',
                industry: 'solar',
                exportDate: new Date().toISOString(),
                settings: settings || {},
                sales: sales || []
            };

            // Create and download file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `commishcrunch-solar-backup-${new Date().toISOString().split('T')[0]}.json`;
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

            // Validate the import data
            if (!importData.version || !importData.industry || importData.industry !== 'solar') {
                alert('Invalid backup file. Please select a valid CommishCrunch solar backup file.');
                return;
            }

            // Confirm import
            const confirmImport = confirm(
                `Import data from ${new Date(importData.exportDate).toLocaleDateString()}?\n\n` +
                `This will merge:\n` +
                `- Settings: ${Object.keys(importData.settings || {}).length} items\n` +
                `- Sales: ${(importData.sales || []).length} records\n\n` +
                `Existing data will be preserved.`
            );

            if (!confirmImport) return;

            // Import settings
            if (importData.settings) {
                await settingsDB.saveSettings('solar', importData.settings);
                
                // Update current state with imported settings
                setPricePerKw(importData.settings.pricePerKw || pricePerKw);
                setBaseRate(importData.settings.baseRate || baseRate);
                setRedlinePrice(importData.settings.redlinePrice || redlinePrice);
                setHasVolumeBonus(importData.settings.hasVolumeBonus || hasVolumeBonus);
                setVolumeThreshold(importData.settings.volumeThreshold || volumeThreshold);
                setVolumeBonusRate(importData.settings.volumeBonusRate || volumeBonusRate);
                setIsSharedCommission(importData.settings.isSharedCommission || isSharedCommission);
                setSharedPercentage(importData.settings.sharedPercentage || sharedPercentage);
                setSharingReason(importData.settings.sharingReason || sharingReason);
            }

            // Import sales
            if (importData.sales && Array.isArray(importData.sales)) {
                for (const sale of importData.sales) {
                    // Add each sale (will create new IDs)
                    await salesDB.addSale({
                        industry: 'solar',
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
            
            // Reset file input
            event.target.value = '';
        } catch (error) {
            console.error('Import error:', error);
            alert('Error importing data. Please check the file format and try again.');
            event.target.value = '';
        }
    };

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Sun className="h-8 w-8 text-orange-500" />
                    <h1 className="text-3xl font-bold text-gray-900">Solar Commission Calculator</h1>
                </div>
                <p className="text-gray-600">Calculate your solar sales commission with precision</p>
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


                    {/* Input Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                System Details
                            </CardTitle>
                            <CardDescription>
                                Enter your solar system information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="customerName">Customer Name (Optional)</Label>
                                    <Input
                                        id="customerName"
                                        placeholder="John Smith"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="text-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="systemSize">System Size (kW)</Label>
                                    <Input
                                        id="systemSize"
                                        type="number"
                                        step="0.1"
                                        placeholder="8.5"
                                        value={systemSize}
                                        onChange={(e) => setSystemSize(e.target.value)}
                                        className="text-lg"
                                    />
                                </div>
                            </div>

                            {/* System info display */}
                            {systemSize && (
                                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">System Size:</span>
                                        <span className="font-medium">{systemSize} kW</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Price per kW:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">${pricePerKw.toFixed(2)}</span>
                                            <Badge variant={
                                                getPriceStatus().color === 'green' ? 'default' :
                                                    getPriceStatus().color === 'red' ? 'destructive' : 'secondary'
                                            }>
                                                {getPriceStatus().text}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Total Sale Amount:</span>
                                        <span className="font-medium">{formatCurrency(parseFloat(systemSize) * pricePerKw)}</span>
                                    </div>
                                </div>
                            )}



                            <div className="flex gap-2">
                                <Button
                                    onClick={calculateCommission}
                                    className="flex-1"
                                    disabled={!systemSize}
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
                                        <span className="text-gray-600">System Size:</span>
                                        <span className="font-medium">{systemSize} kW</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Sale:</span>
                                        <span className="font-medium">{formatCurrency(result.saleAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Price per kW:</span>
                                        <span className="font-medium">${result.pricePerKw.toFixed(2)}</span>
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
                </TabsContent>

                <TabsContent value="tracker" className="space-y-6">
                    <SalesTracker industry="solar" />
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">


                    {/* Pricing Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Pricing & Commission Settings
                                <Badge variant="outline" className="text-xs">
                                    Auto-saved
                                </Badge>
                            </CardTitle>
                            <CardDescription>Configure your company's pricing and commission structure. Settings are automatically saved.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pricePerKw">Price per kW ($)</Label>
                                    <Input
                                        id="pricePerKw"
                                        type="number"
                                        step="0.01"
                                        value={pricePerKw}
                                        onChange={(e) => setPricePerKw(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="baseRate">Base Commission Rate (%)</Label>
                                    <Input
                                        id="baseRate"
                                        type="number"
                                        step="0.1"
                                        value={baseRate}
                                        onChange={(e) => setBaseRate(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="redlinePrice">Redline Price ($/kW)</Label>
                                    <Input
                                        id="redlinePrice"
                                        type="number"
                                        step="0.01"
                                        value={redlinePrice}
                                        onChange={(e) => setRedlinePrice(parseFloat(e.target.value) || 0)}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Minimum acceptable price per kW. Sales below this get a commission penalty.
                                    </p>
                                </div>

                            </div>
                        </CardContent>
                    </Card>

                    {/* Volume Bonus Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Volume Bonus Settings
                                <Badge variant="outline" className="text-xs">
                                    Auto-saved
                                </Badge>
                            </CardTitle>
                            <CardDescription>Configure monthly sales volume bonuses. Bonus applies when you reach the target number of completed sales per month.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="hasVolumeBonus"
                                    checked={hasVolumeBonus}
                                    onCheckedChange={setHasVolumeBonus}
                                />
                                <Label htmlFor="hasVolumeBonus" className="font-medium">Enable volume bonus</Label>
                            </div>

                            {hasVolumeBonus && (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="volumeThreshold">Monthly Sales Target</Label>
                                            <Input
                                                id="volumeThreshold"
                                                type="number"
                                                min="1"
                                                value={volumeThreshold}
                                                onChange={(e) => setVolumeThreshold(parseInt(e.target.value) || 1)}
                                            />
                                            <p className="text-xs text-gray-500">
                                                Number of completed sales needed per month to earn bonus
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="volumeBonusRate">Volume Bonus Rate (%)</Label>
                                            <Input
                                                id="volumeBonusRate"
                                                type="number"
                                                step="0.1"
                                                value={volumeBonusRate}
                                                onChange={(e) => setVolumeBonusRate(parseFloat(e.target.value) || 0)}
                                            />
                                            <p className="text-xs text-gray-500">
                                                Extra commission percentage when target is reached
                                            </p>
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
                                                placeholder="e.g., Split with setter"
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
                                    <li>• Share your company's commission structure with teammates</li>
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
                </TabsContent>
            </Tabs>
        </div>
    );
}