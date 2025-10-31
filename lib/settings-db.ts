export interface IndustrySettings {
  industry: string;
  settings: Record<string, any>;
  lastUpdated: Date;
}

class SettingsDB {
  private dbName = 'CommishCrunchSettingsDB';
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
        
        if (!db.objectStoreNames.contains('settings')) {
          const store = db.createObjectStore('settings', { keyPath: 'industry' });
          store.createIndex('industry', 'industry', { unique: true });
        }
      };
    });
  }

  async saveSettings(industry: string, settings: Record<string, any>): Promise<void> {
    if (!this.db) await this.init();

    const settingsRecord: IndustrySettings = {
      industry,
      settings,
      lastUpdated: new Date()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put(settingsRecord);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSettings(industry: string): Promise<Record<string, any> | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(industry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.settings : null);
      };
    });
  }

  async getAllSettings(): Promise<IndustrySettings[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const settings = request.result.map(setting => ({
          ...setting,
          lastUpdated: new Date(setting.lastUpdated)
        }));
        resolve(settings);
      };
    });
  }

  async deleteSettings(industry: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.delete(industry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async exportSettings(): Promise<Record<string, Record<string, any>>> {
    const allSettings = await this.getAllSettings();
    const exported: Record<string, Record<string, any>> = {};
    
    allSettings.forEach(setting => {
      exported[setting.industry] = setting.settings;
    });
    
    return exported;
  }

  async importSettings(settingsData: Record<string, Record<string, any>>): Promise<void> {
    for (const [industry, settings] of Object.entries(settingsData)) {
      await this.saveSettings(industry, settings);
    }
  }
}

export const settingsDB = new SettingsDB();