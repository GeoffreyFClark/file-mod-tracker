import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri';

const REGISTRY_EVENTS_KEY = 'registryEvents';

export interface RegistryEvent {
  type: string;
  key: string;
  value: string;
  previousData?: string;
  newData?: string;
  timestamp: string;
}

interface RegistryCache {
  [key: string]: {
    changeCount: number;
    lastModified: string;
  }
}

export class RegistryMonitor {
  private isMonitoring: boolean = false;
  private events: RegistryEvent[] = [];
  private cache: RegistryCache = {};
  private updateState: (isMonitoring: boolean, events: RegistryEvent[]) => void;
  private listenerSetup: boolean = false;
  private unsubscribe?: () => void;

  constructor(updateState: (isMonitoring: boolean, events: RegistryEvent[]) => void) {
    // console.log('[RegistryMonitor] Constructor called');
    this.updateState = updateState;
    
    const savedEvents = localStorage.getItem(REGISTRY_EVENTS_KEY);
    if (savedEvents) {
      // console.log('[RegistryMonitor] Loading saved events');
      this.events = JSON.parse(savedEvents);
      this.rebuildCache();
    }
    
    this.setupListener().catch(error => {
      console.error('[RegistryMonitor] Error in initial listener setup:', error);
    });
  }

  private rebuildCache() {
    this.cache = {};
    this.events.forEach(event => {
      const normalizedKey = this.normalizeKey(event.key);
      if (!this.cache[normalizedKey]) {
        this.cache[normalizedKey] = {
          changeCount: 0,
          lastModified: event.timestamp
        };
      }
      this.cache[normalizedKey].changeCount++;
      this.cache[normalizedKey].lastModified = event.timestamp;
    });
  }

  private normalizeKey(key: string): string {
    return key.replace(' was changed.', '').trim();
  }

  private async setupListener() {
    if (this.listenerSetup) {
      // console.log('[RegistryMonitor] Listener already setup, skipping');
      return;
    }

    // console.log('[RegistryMonitor] Setting up new listener');
    this.unsubscribe = await listen('registry-change-event', (event) => {
      console.log('[RegistryMonitor] Received registry change event');
      const eventData = event.payload as string;
      
      const lines = eventData.split('\n');
      
      const registryEvent: RegistryEvent = {
        type: 'UNKNOWN',
        key: '',
        value: '',
        timestamp: new Date().toISOString(),
      };

      for (const line of lines) {
        if (line.startsWith('UPDATED:') || line.startsWith('ADDED:') || line.startsWith('REMOVED:')) {
          const [type, content] = line.split(': ');
          registryEvent.type = type.trim();
          
          const valueMatch = content.match(/Value '([^']+)' in registry key '([^']+)'/);
          if (valueMatch) {
            registryEvent.value = valueMatch[1];
            registryEvent.key = valueMatch[2];
          }
        } else if (line.startsWith('Previous Data:')) {
          registryEvent.previousData = line.split(':')[1].trim().replace(/'/g, '');
        } else if (line.startsWith('New Data:')) {
          registryEvent.newData = line.split(':')[1].trim().replace(/'/g, '');
        }
      }

      const normalizedKey = this.normalizeKey(registryEvent.key);
      if (!this.cache[normalizedKey]) {
        this.cache[normalizedKey] = {
          changeCount: 0,
          lastModified: registryEvent.timestamp
        };
      }
      this.cache[normalizedKey].changeCount++;
      this.cache[normalizedKey].lastModified = registryEvent.timestamp;

      this.events = [...this.events, registryEvent];
      localStorage.setItem(REGISTRY_EVENTS_KEY, JSON.stringify(this.events));
      this.updateState(this.isMonitoring, this.events);
    });

    this.listenerSetup = true;
    // console.log('[RegistryMonitor] Listener setup complete');
  }

  public async dispose(): Promise<void> {
    // console.log('[RegistryMonitor] Disposing monitor');
    if (this.unsubscribe) {
      await this.unsubscribe();
      this.unsubscribe = undefined;
      this.listenerSetup = false;
    }
  }

  public getChangeCount(key: string): number {
    const normalizedKey = this.normalizeKey(key);
    return this.cache[normalizedKey]?.changeCount || 0;
  }

  public getLastModified(key: string): string | null {
    const normalizedKey = this.normalizeKey(key);
    return this.cache[normalizedKey]?.lastModified || null;
  }

  public async clearStorage(): Promise<void> {
    // console.log('[RegistryMonitor] clearStorage called');
    
    this.events = [];
    this.cache = {};
    localStorage.removeItem(REGISTRY_EVENTS_KEY);
    this.updateState(this.isMonitoring, this.events);
  }

  public async checkMonitoringStatus(): Promise<void> {
    try {
      this.isMonitoring = await invoke('is_registry_monitoring');
      this.updateState(this.isMonitoring, this.events);
    } catch (error) {
      console.error('[RegistryMonitor] Error checking registry monitoring status:', error);
      throw error;
    }
  }

  public async startMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      try {
        await invoke('start_registry_monitoring');
        this.isMonitoring = true;
        this.updateState(this.isMonitoring, this.events);
      } catch (error) {
        console.error('[RegistryMonitor] Error starting registry monitoring:', error);
        throw error;
    }
  }
  }

  public async stopMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      try {
        await invoke('stop_registry_monitoring');
        this.isMonitoring = false;
        this.updateState(this.isMonitoring, this.events);
      } catch (error) {
        console.error('[RegistryMonitor] Error stopping registry monitoring:', error);
        throw error;
      }
    }
  }
}