import { createContext, createElement, useContext, useEffect, useMemo, useRef, useState } from 'react';

const PopoverContext = createContext(null);

export function Popover({ children }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        open &&
        !triggerRef.current?.contains(event.target) &&
        !contentRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const value = useMemo(
    () => ({ open, setOpen, triggerRef, contentRef }),
    [open],
  );

  return createElement(PopoverContext.Provider, { value }, children);
}

export function PopoverTrigger({ children, asChild = false }) {
  const context = useContext(PopoverContext);
  if (!context) return null;

  const child = asChild ? children : <button type="button">{children}</button>;
  return createElement(
    'div',
    {
      ref: context.triggerRef,
      onClick: () => context.setOpen((value) => !value),
      className: 'inline-flex',
    },
    child,
  );
}

export function PopoverContent({ children, className = '' }) {
  const context = useContext(PopoverContext);
  if (!context || !context.open) return null;

  return (
    <div ref={context.contentRef} className={className}>
      {children}
    </div>
  );
}
