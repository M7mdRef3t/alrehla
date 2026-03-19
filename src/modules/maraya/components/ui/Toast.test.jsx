import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Toast } from './Toast.jsx';

describe('Toast', () => {
  it('uses alert semantics for error toasts', () => {
    render(<Toast id="t1" type="error" message="Failed" onDismiss={vi.fn()} />);
    const toast = screen.getByRole('alert');
    expect(toast.getAttribute('aria-live')).toBe('assertive');
  }, 15000);

  it('pauses and resumes timer on hover', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(<Toast id="t2" message="Saved" duration={1000} onDismiss={onDismiss} />);
    const toast = screen.getByRole('status');

    fireEvent.mouseEnter(toast);
    vi.advanceTimersByTime(1200);
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.mouseLeave(toast);
    vi.advanceTimersByTime(1000);
    expect(onDismiss).toHaveBeenCalledWith('t2');

    vi.useRealTimers();
  }, 15000);
});
