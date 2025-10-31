'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Edit, 
  Trash2,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { salesDB, SaleRecord } from '@/lib/sales-db';

interface SalesTrackerProps {
  industry?: string;
  onAddSale?: (sale: Omit<SaleRecord, 'id' | 'dateCreated'>) => void;
}

export default function SalesTracker({ industry = 'solar', onAddSale }: SalesTrackerProps) {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCommission: 0,
    pendingSales: 0,
    completedSales: 0,
    averageSaleAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);

  // Form state for adding/editing sales
  const [formData, setFormData] = useState({
    customerName: '',
    systemSize: '', // For solar: kW, for lighting: linear feet
    saleAmount: '',
    commission: '',
    status: 'pending' as SaleRecord['status'],
    notes: ''
  });

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const [industrySales, salesStats] = await Promise.all([
        salesDB.getSalesByIndustry(industry),
        salesDB.getStats(industry)
      ]);
      setSales(industrySales.sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime()));
      setStats(salesStats);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSale = async () => {
    if (!formData.customerName || !formData.systemSize || !formData.saleAmount || !formData.commission) {
      return;
    }

    try {
      const saleData = {
        industry,
        customerName: formData.customerName,
        saleAmount: parseFloat(formData.saleAmount),
        commission: parseFloat(formData.commission),
        status: formData.status,
        notes: formData.notes,
        industryData: industry === 'solar' ? {
          systemSize: parseFloat(formData.systemSize),
          pricePerWatt: parseFloat(formData.saleAmount) / (parseFloat(formData.systemSize) * 1000)
        } : industry === 'lighting' ? {
          linearFeet: parseFloat(formData.systemSize),
          pricePerFoot: parseFloat(formData.saleAmount) / parseFloat(formData.systemSize)
        } : {
          systemSize: parseFloat(formData.systemSize)
        }
      };

      if (editingSale) {
        await salesDB.updateSale(editingSale.id, saleData);
        setEditingSale(null);
      } else {
        await salesDB.addSale(saleData);
        if (onAddSale) {
          onAddSale(saleData);
        }
      }

      setFormData({
        customerName: '',
        systemSize: '',
        saleAmount: '',
        commission: '',
        status: 'pending',
        notes: ''
      });

      await loadSales();
    } catch (error) {
      console.error('Error saving sale:', error);
    }
  };

  const handleEditSale = (sale: SaleRecord) => {
    setEditingSale(sale);
    setFormData({
      customerName: sale.customerName,
      systemSize: (industry === 'solar' ? sale.industryData?.systemSize?.toString() : 
                   industry === 'lighting' ? sale.industryData?.linearFeet?.toString() : 
                   sale.industryData?.systemSize?.toString()) || '',
      saleAmount: sale.saleAmount.toString(),
      commission: sale.commission.toString(),
      status: sale.status,
      notes: sale.notes || ''
    });
  };

  const handleDeleteSale = async (id: string) => {
    if (confirm('Are you sure you want to delete this sale?')) {
      try {
        await salesDB.deleteSale(id);
        await loadSales();
      } catch (error) {
        console.error('Error deleting sale:', error);
      }
    }
  };

  const handleStatusChange = async (id: string, status: SaleRecord['status']) => {
    try {
      const updates: Partial<SaleRecord> = { status };
      if (status === 'completed') {
        updates.dateCompleted = new Date();
      }
      await salesDB.updateSale(id, updates);
      await loadSales();
    } catch (error) {
      console.error('Error updating sale status:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status: SaleRecord['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: SaleRecord['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading sales data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold">{stats.totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Commission</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalCommission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Sale Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.averageSaleAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales">Sales History</TabsTrigger>
          <TabsTrigger value="add">Add Sale</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales History</CardTitle>
              <CardDescription>
                Track and manage your {industry === 'solar' ? 'solar' : industry === 'lighting' ? 'permanent lighting' : industry} sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sales.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No sales recorded yet. Add your first sale to get started!
                  </div>
                ) : (
                  sales.map((sale) => (
                    <div key={sale.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{sale.customerName}</h3>
                          <p className="text-sm text-gray-600">
                            {industry === 'solar' && sale.industryData?.systemSize ? `${sale.industryData.systemSize} kW • ` : ''}
                            {industry === 'lighting' && sale.industryData?.linearFeet ? `${sale.industryData.linearFeet} ft • ` : ''}
                            {formatCurrency(sale.saleAmount)}
                            {industry === 'solar' && sale.industryData?.pricePerWatt ? ` • $${sale.industryData.pricePerWatt.toFixed(2)}/W` : ''}
                            {industry === 'lighting' && sale.industryData?.pricePerFoot ? ` • $${sale.industryData.pricePerFoot.toFixed(2)}/ft` : ''}
                          </p>
                          <p className="text-sm text-gray-600">
                            Created: {formatDate(sale.dateCreated)}
                            {sale.dateCompleted && ` • Completed: ${formatDate(sale.dateCompleted)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(sale.status)} className="flex items-center gap-1">
                            {getStatusIcon(sale.status)}
                            {sale.status}
                          </Badge>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(sale.commission)}
                          </span>
                        </div>
                      </div>

                      {sale.notes && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {sale.notes}
                        </p>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Select
                          value={sale.status}
                          onValueChange={(status: SaleRecord['status']) => 
                            handleStatusChange(sale.id, status)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSale(sale)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSale(sale.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editingSale ? 'Edit Sale' : 'Add New Sale'}
              </CardTitle>
              <CardDescription>
                {editingSale ? 'Update sale information' : `Record a new ${industry === 'solar' ? 'solar' : industry === 'lighting' ? 'permanent lighting' : industry} sale`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    placeholder="John Smith"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systemSize">
                    {industry === 'solar' ? 'System Size (kW)' : 
                     industry === 'lighting' ? 'Linear Feet' : 'System Size'}
                  </Label>
                  <Input
                    id="systemSize"
                    type="number"
                    step={industry === 'solar' ? "0.1" : "1"}
                    placeholder={industry === 'solar' ? "8.5" : industry === 'lighting' ? "200" : "8.5"}
                    value={formData.systemSize}
                    onChange={(e) => setFormData(prev => ({ ...prev, systemSize: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saleAmount">Sale Amount ($)</Label>
                  <Input
                    id="saleAmount"
                    type="number"
                    placeholder="25000"
                    value={formData.saleAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, saleAmount: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commission">Commission ($)</Label>
                  <Input
                    id="commission"
                    type="number"
                    placeholder="875"
                    value={formData.commission}
                    onChange={(e) => setFormData(prev => ({ ...prev, commission: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(status: SaleRecord['status']) => 
                      setFormData(prev => ({ ...prev, status }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Additional notes about this sale..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddSale} className="flex-1">
                  {editingSale ? 'Update Sale' : 'Add Sale'}
                </Button>
                {editingSale && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditingSale(null);
                      setFormData({
                        customerName: '',
                        systemSize: '',
                        saleAmount: '',
                        commission: '',
                        status: 'pending',
                        notes: ''
                      });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}