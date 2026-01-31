import { useState, useCallback } from "react";

/**
 * Hook لإدارة حالة فتح/إغلاق Modal أو أي عنصر قابل للتبديل
 */
export function useModalState(initialValue = false) {
  const [isOpen, setIsOpen] = useState(initialValue);
  
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);
  
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen
  };
}

/**
 * Hook لإدارة حالة مع قيمة (مثل ID)
 */
export function useModalStateWithValue<T = string>() {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState<T | null>(null);
  
  const open = useCallback((val?: T) => {
    setIsOpen(true);
    if (val !== undefined) {
      setValue(val);
    }
  }, []);
  
  const close = useCallback(() => {
    setIsOpen(false);
    setValue(null);
  }, []);
  
  const updateValue = useCallback((val: T | null) => {
    setValue(val);
  }, []);
  
  return {
    isOpen,
    value,
    open,
    close,
    updateValue,
    setIsOpen,
    setValue
  };
}
