import * as React from 'react';
import { Dialog as HDialog, Transition } from '@headlessui/react';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <Transition.Root show={open} as={React.Fragment}>
      <HDialog as="div" className="relative z-50" onClose={onOpenChange}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 translate-y-2" enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-2"
            >
              <HDialog.Panel className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900">
                {children}
              </HDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HDialog>
    </Transition.Root>
  );
}

export function DialogHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`border-b border-gray-200 p-4 dark:border-gray-800 ${className}`} {...props} />;
}

export function DialogTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-lg font-semibold ${className}`} {...props} />;
}

export function DialogDescription({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-gray-600 dark:text-gray-300 ${className}`} {...props} />;
}

export function DialogFooter({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex items-center justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-800 ${className}`} {...props} />;
}

export default Dialog;
