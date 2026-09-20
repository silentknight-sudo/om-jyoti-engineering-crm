import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot
} from '../lib/firebase';
import { Lead, InventoryItem, ActivityLog, CallLog, LeadNote, User } from '../types';

export const firestoreService = {
  /**
   * Check connection to Firestore database
   */
  async checkConnection(): Promise<{ connected: boolean; count?: number; error?: string }> {
    try {
      const leadsCol = collection(db, 'leads');
      const snap = await getDocs(query(leadsCol, limit(1)));
      return { connected: true, count: snap.size };
    } catch (err: any) {
      console.warn('Firestore connection check notice:', err?.message);
      return { connected: false, error: err?.message || 'Connection failed' };
    }
  },

  /**
   * Sync initial dataset to Firestore if empty or on demand
   */
  async syncInitialData(data: {
    leads: Lead[];
    inventory: InventoryItem[];
    users: User[];
  }): Promise<{ success: boolean; syncedLeads: number; syncedInventory: number }> {
    try {
      let syncedLeads = 0;
      let syncedInventory = 0;

      // Seed/Sync Users
      for (const u of data.users) {
        await setDoc(doc(db, 'users', u.id), u, { merge: true });
      }

      // Seed/Sync Leads
      for (const lead of data.leads) {
        await setDoc(doc(db, 'leads', lead.id), lead, { merge: true });
        syncedLeads++;
      }

      // Seed/Sync Inventory
      for (const item of data.inventory) {
        await setDoc(doc(db, 'inventory_items', item.id), item, { merge: true });
        syncedInventory++;
      }

      return { success: true, syncedLeads, syncedInventory };
    } catch (err: any) {
      console.error('Error syncing to Firestore:', err);
      throw err;
    }
  },

  /**
   * Realtime listener for Leads
   */
  subscribeToLeads(callback: (leads: Lead[]) => void) {
    const colRef = collection(db, 'leads');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const leads: Lead[] = [];
      snapshot.forEach((docSnap) => {
        leads.push({ id: docSnap.id, ...docSnap.data() } as Lead);
      });
      callback(leads);
    }, (err) => {
      console.warn('Firestore leads subscription listener:', err.message);
    });
  },

  /**
   * Realtime listener for Inventory
   */
  subscribeToInventory(callback: (items: InventoryItem[]) => void) {
    const colRef = collection(db, 'inventory_items');
    return onSnapshot(colRef, (snapshot) => {
      const items: InventoryItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as InventoryItem);
      });
      callback(items);
    }, (err) => {
      console.warn('Firestore inventory subscription listener:', err.message);
    });
  },

  /**
   * Realtime listener for Activity Logs
   */
  subscribeToActivityLogs(callback: (logs: ActivityLog[]) => void, maxLogs = 50) {
    const colRef = collection(db, 'activity_logs');
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxLogs));
    return onSnapshot(q, (snapshot) => {
      const logs: ActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...docSnap.data() } as ActivityLog);
      });
      callback(logs);
    }, (err) => {
      console.warn('Firestore activity logs subscription listener:', err.message);
    });
  },

  /**
   * Save Lead
   */
  async saveLead(lead: Lead): Promise<void> {
    const leadRef = doc(db, 'leads', lead.id);
    await setDoc(leadRef, lead, { merge: true });
  },

  /**
   * Update Lead
   */
  async updateLead(leadId: string, updates: Partial<Lead>): Promise<void> {
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, { ...updates, updatedAt: new Date().toISOString() });
  },

  /**
   * Log Call
   */
  async addCallLog(callLog: CallLog): Promise<void> {
    const logRef = doc(db, 'call_logs', callLog.id);
    await setDoc(logRef, callLog);
  },

  /**
   * Add Lead Note
   */
  async addLeadNote(note: LeadNote): Promise<void> {
    const noteRef = doc(db, 'lead_notes', note.id);
    await setDoc(noteRef, note);
  },

  /**
   * Log Activity Audit
   */
  async logActivity(log: ActivityLog): Promise<void> {
    const logRef = doc(db, 'activity_logs', log.id);
    await setDoc(logRef, log);
  }
};
