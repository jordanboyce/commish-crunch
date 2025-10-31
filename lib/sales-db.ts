export interface SaleRecord {
  id: string;
  industry: string; // 'solar', 'lighting', 'pest', etc.
  customerName: string;
  saleAmount: number;
  commission: number;
  status: 'pending' | 'completed' | 'cancelled';
  dateCreated: Date;
  dateCompleted?: Date;
  notes?: string;
  // Industry-specific data stored as flexible object
  industryData: Record<string, any>;
}

class SalesDB {
  private dbName = 'SolarSalesDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('sales')) {
          const store = db.createObjectStore('sales', { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('dateCreated', 'dateCreated', { unique: false });
        }
      };
    });
  }

  async addSale(sale: Omit<SaleRecord, 'id' | 'dateCreated'>): Promise<string> {
    if (!this.db) await this.init();

    const id = crypto.randomUUID();
    const saleRecord: SaleRecord = {
      ...sale,
      id,
      dateCreated: new Date()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sales'], 'readwrite');
      const store = transaction.objectStore('sales');
      const request = store.add(saleRecord);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(id);
    });
  }

  async updateSale(id: string, updates: Partial<SaleRecord>): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sales'], 'readwrite');
      const store = transaction.objectStore('sales');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const sale = getRequest.result;
        if (sale) {
          const updatedSale = { ...sale, ...updates };
          const putRequest = store.put(updatedSale);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Sale not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getAllSales(): Promise<SaleRecord[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sales'], 'readonly');
      const store = transaction.objectStore('sales');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const sales = request.result.map(sale => ({
          ...sale,
          dateCreated: new Date(sale.dateCreated),
          dateCompleted: sale.dateCompleted ? new Date(sale.dateCompleted) : undefined
        }));
        resolve(sales);
      };
    });
  }

  async getSalesByStatus(status: SaleRecord['status']): Promise<SaleRecord[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sales'], 'readonly');
      const store = transaction.objectStore('sales');
      const index = store.index('status');
      const request = index.getAll(status);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const sales = request.result.map(sale => ({
          ...sale,
          dateCreated: new Date(sale.dateCreated),
          dateCompleted: sale.dateCompleted ? new Date(sale.dateCompleted) : undefined
        }));
        resolve(sales);
      };
    });
  }

  async getSalesByIndustry(industry: string): Promise<SaleRecord[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sales'], 'readonly');
      const store = transaction.objectStore('sales');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const sales = request.result
          .filter(sale => sale.industry === industry)
          .map(sale => ({
            ...sale,
            dateCreated: new Date(sale.dateCreated),
            dateCompleted: sale.dateCompleted ? new Date(sale.dateCompleted) : undefined
          }));
        resolve(sales);
      };
    });
  }

  async getSalesByIndustryAndStatus(industry: string, status: SaleRecord['status']): Promise<SaleRecord[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sales'], 'readonly');
      const store = transaction.objectStore('sales');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const sales = request.result
          .filter(sale => sale.industry === industry && sale.status === status)
          .map(sale => ({
            ...sale,
            dateCreated: new Date(sale.dateCreated),
            dateCompleted: sale.dateCompleted ? new Date(sale.dateCompleted) : undefined
          }));
        resolve(sales);
      };
    });
  }

  async deleteSale(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sales'], 'readwrite');
      const store = transaction.objectStore('sales');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getStats(industry?: string): Promise<{
    totalSales: number;
    totalCommission: number;
    pendingSales: number;
    completedSales: number;
    averageSaleAmount: number;
  }> {
    const sales = industry ? await this.getSalesByIndustry(industry) : await this.getAllSales();
    const completed = sales.filter(s => s.status === 'completed');
    
    return {
      totalSales: completed.length,
      totalCommission: completed.reduce((sum, sale) => sum + sale.commission, 0),
      pendingSales: sales.filter(s => s.status === 'pending').length,
      completedSales: completed.length,
      averageSaleAmount: completed.length > 0 
        ? completed.reduce((sum, sale) => sum + sale.saleAmount, 0) / completed.length 
        : 0
    };
  }
}

export const salesDB = new SalesDB();