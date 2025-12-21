"use client";

import * as React from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// -- Context for the prompt input state --
interface PromptInputContextValue {
  value: string;
  setValue: (value: string) => void;
  isLoading: boolean;
  disabled: boolean;
  onSubmit: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const PromptInputContext = React.createContext<PromptInputContextValue | undefined>(
  undefined
);

export function usePromptInput() {
  const context = React.useContext(PromptInputContext);
  if (!context) {
    throw new Error("usePromptInput must be used within a PromptInputProvider");
  }
  return context;
}

// -- Components --

export function PromptInputProvider({ children }: { children: React.ReactNode }) {
  // In a real app, you might lift state up or use a store.
  // For this UI component, we'll let the PromptInput control the context if needed,
  // but the user's example wraps everything in Provider.
  // We'll use a dummy context here since the actual state is often controlled by PromptInput props.
  return (
    <PromptInputContext.Provider
      value={{
        value: "",
        setValue: () => {},
        isLoading: false,
        disabled: false,
        onSubmit: () => {},
        fileInputRef: React.createRef<HTMLInputElement>(),
      }}
    >
      {children}
    </PromptInputContext.Provider>
  );
}

export interface PromptInputProps {
  children: React.ReactNode;
  onSubmit: (message: any) => void;
  value?: string;
  onValueChange?: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PromptInput({
  children,
  onSubmit,
  value,
  onValueChange,
  isLoading = false,
  disabled = false,
  className,
}: PromptInputProps) {
  // We allow controlled or uncontrolled, but for this implementation we prefer controlled from parent
  const [internalValue, setInternalValue] = React.useState("");
  const isControlled = value !== undefined;
  const actualValue = isControlled ? value : internalValue;
  const actualOnChange = isControlled ? onValueChange : setInternalValue;

  const handleSubmit = () => {
    if (!actualValue.trim() || isLoading || disabled) return;
    onSubmit({ text: actualValue });
    if (!isControlled) setInternalValue("");
  };

  // Provide context for children
  const contextValue: PromptInputContextValue = {
    value: actualValue,
    setValue: (val) => actualOnChange?.(val),
    isLoading,
    disabled,
    onSubmit: handleSubmit,
    fileInputRef: React.createRef(),
  };

  return (
    <PromptInputContext.Provider value={contextValue}>
      <div
        className={cn(
          "relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all focus-within:ring-1 focus-within:ring-ring/20",
          className
        )}
      >
        {children}
      </div>
    </PromptInputContext.Provider>
  );
}

export function PromptInputBody({ children }: { children: React.ReactNode }) {
  return <div className="relative min-h-[60px] w-full px-4 pt-3 pb-10">{children}</div>;
}

export const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<typeof Textarea>
>(({ className, ...props }, ref) => {
  const { value, setValue, onSubmit, isLoading, disabled } = usePromptInput();
  const internalRef = React.useRef<HTMLTextAreaElement>(null);

  React.useImperativeHandle(ref, () => internalRef.current!);

  React.useEffect(() => {
    const textarea = internalRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Textarea
      ref={internalRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={disabled || isLoading}
      rows={1}
      className={cn(
        "min-h-[24px] max-h-[200px] w-full resize-none border-0 bg-transparent px-0 py-0 text-base shadow-none outline-none focus-visible:ring-0 placeholder:text-muted-foreground",
        className
      )}
      placeholder="Ask anything..."
      {...props}
    />
  );
});
PromptInputTextarea.displayName = "PromptInputTextarea";

export function PromptInputFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
      {children}
    </div>
  );
}

export function PromptInputTools({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-1">{children}</div>;
}

export function PromptInputButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-8 gap-2 rounded-lg text-muted-foreground hover:text-foreground px-2", className)}
      {...props}
    >
      {children}
    </Button>
  );
}

export function PromptInputSubmit({ status }: { status?: string }) {
  const { onSubmit, value, isLoading } = usePromptInput();
  const canSend = !!value.trim() && !isLoading;

  return (
    <Button
      onClick={onSubmit}
      disabled={!canSend}
      size="icon"
      className={cn(
        "h-8 w-8 rounded-lg transition-all",
        canSend
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-muted text-muted-foreground"
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <SendHorizontal className="h-4 w-4" />
      )}
    </Button>
  );
}
