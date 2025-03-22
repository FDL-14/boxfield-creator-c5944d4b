
import { v4 as uuidv4 } from 'uuid';

// Base entity with common CRUD operations
class Entity {
  static async list(orderBy?: string) {
    let data = this.getFromLocalStorage();
    
    if (orderBy && data && data.length > 0) {
      data.sort((a: any, b: any) => {
        if (a[orderBy] < b[orderBy]) return -1;
        if (a[orderBy] > b[orderBy]) return 1;
        return 0;
      });
    }
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300));
    return data;
  }
  
  static async get(id: string) {
    const data = this.getFromLocalStorage();
    const item = data.find((item: any) => item.id === id);
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300));
    return item;
  }
  
  static async create(data: any) {
    const items = this.getFromLocalStorage();
    const newItem = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      order: items.length
    };
    
    items.push(newItem);
    this.saveToLocalStorage(items);
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    return newItem;
  }
  
  static async update(id: string, data: any) {
    const items = this.getFromLocalStorage();
    const index = items.findIndex((item: any) => item.id === id);
    
    if (index === -1) {
      throw new Error(`Item with id ${id} not found`);
    }
    
    items[index] = {
      ...items[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.saveToLocalStorage(items);
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    return items[index];
  }
  
  static async delete(id: string) {
    const items = this.getFromLocalStorage();
    const index = items.findIndex((item: any) => item.id === id);
    
    if (index === -1) {
      throw new Error(`Item with id ${id} not found`);
    }
    
    const deleted = items.splice(index, 1)[0];
    this.saveToLocalStorage(items);
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    return deleted;
  }
  
  static getFromLocalStorage() {
    if (typeof window === 'undefined') return [];
    
    const key = this.getStorageKey();
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }
  
  static saveToLocalStorage(data: any[]) {
    if (typeof window === 'undefined') return;
    
    const key = this.getStorageKey();
    localStorage.setItem(key, JSON.stringify(data));
  }
  
  static getStorageKey() {
    return `${this.name.toLowerCase()}_data`;
  }
}

// Form Box entity
export class FormBox extends Entity {
  static async create(data: any) {
    const boxData = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      order: this.getFromLocalStorage().length
    };
    
    const boxes = this.getFromLocalStorage();
    boxes.push(boxData);
    this.saveToLocalStorage(boxes);
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    return boxData;
  }
}

// Form Field entity
export class FormField extends Entity {
  static async create(data: any) {
    const fieldData = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      order: this.getFromLocalStorage().filter((f: any) => f.box_id === data.box_id).length
    };
    
    const fields = this.getFromLocalStorage();
    fields.push(fieldData);
    this.saveToLocalStorage(fields);
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    return fieldData;
  }
}
