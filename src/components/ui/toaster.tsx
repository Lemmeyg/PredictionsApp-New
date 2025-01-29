"use client"

import { useToast } from "@/components/ui/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()
  
  console.log('Toaster component rendering, toasts:', toasts);

  return (
    <ToastProvider swipeDirection="right">
      <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
        {toasts.map(({ id, title, description, action, ...props }) => {
          console.log('Rendering individual toast:', { id, title, description });
          return (
            <Toast 
              key={id} 
              {...props} 
              className="bg-[#1a1f2e] border-[#1a1f2e] text-white text-center"
            >
              <div className="grid gap-1">
                {title && (
                  <ToastTitle className="text-[#ffa500] font-semibold text-center">
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription className="text-white text-center">
                    {description}
                  </ToastDescription>
                )}
              </div>
              {action}
              <ToastClose className="text-white hover:text-[#ffa500]" />
            </Toast>
          );
        })}
      </div>
      <ToastViewport />
    </ToastProvider>
  )
}
