import React, { useState } from "react";

let toastHandlers = [];

export function toast({ title, description, variant = "default" }) {
  const id = Math.random().toString(36);
  const toastData = { id, title, description, variant };
  
  toastHandlers.forEach(handler => handler.add(toastData));
  
  setTimeout(() => {
    toastHandlers.forEach(handler => handler.remove(id));
  }, 3000);
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  React.useEffect(() => {
    const handler = {
      add: (toast) => setToasts(prev => [...prev, toast]),
      remove: (id) => setToasts(prev => prev.filter(t => t.id !== id))
    };
    
    toastHandlers.push(handler);
    
    return () => {
      toastHandlers = toastHandlers.filter(h => h !== handler);
    };
  }, []);

  return { toasts, toast };
}