// src/utils/areDataEqual.ts

export const areDataEqual = (data1: any[], data2: any[]): boolean => {
    if (data1.length !== data2.length) return false;
  
    for (let i = 0; i < data1.length; i++) {
      const obj1 = data1[i];
      const obj2 = data2[i];
  
      if (obj1.Path !== obj2.Path) return false;
      if (obj1.PID !== obj2.PID) return false;
      if (obj1.Type !== obj2.Type) return false;
      if (obj1.Timestamp !== obj2.Timestamp) return false;
      if (obj1.Changes !== obj2.Changes) return false;
  
      // Compare entries array length
      if (obj1.entries.length !== obj2.entries.length) return false;
  
      // Compare each entry
      for (let j = 0; j < obj1.entries.length; j++) {
        const entry1 = obj1.entries[j];
        const entry2 = obj2.entries[j];
  
        if (entry1.Path !== entry2.Path) return false;
        if (entry1.PID !== entry2.PID) return false;
        if (entry1.Type !== entry2.Type) return false;
        if (entry1.Timestamp !== entry2.Timestamp) return false;
      }
    }
  
    return true;
  };
  