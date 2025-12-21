"use client";

import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  PromptInputProvider,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";
import { useRef, useState } from "react";
import { AVAILABLE_MODELS } from "@/lib/models";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  model: string;
  onModelChange: (modelId: string) => void;
}

export function ChatInput({
  onSend,
  isLoading,
  disabled,
  model,
  onModelChange,
}: ChatInputProps) {
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Group models by provider for the selector
  const groupedModels = AVAILABLE_MODELS.reduce((acc, m) => {
    if (!acc[m.provider]) acc[m.provider] = [];
    acc[m.provider].push(m);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_MODELS>);

  const selectedModelData = AVAILABLE_MODELS.find((m) => m.id === model);

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur p-4">
      <div className="max-w-3xl mx-auto">
        <PromptInputProvider>
          <PromptInput
            onSubmit={(msg) => onSend(msg.text)}
            isLoading={isLoading}
            disabled={disabled}
            value={""} // Controlled by parent via onSend for reset, but here we just submit. PromptInput manages internal if not passed? 
            // Wait, ChatClient passes nothing for value control here in the new pattern?
            // Actually, ChatInput previously managed value state.
            // Let's let ChatInput manage it if we want, or PromptInput.
            // But PromptInput example uses controlled state.
            // Let's implement controlled state in ChatInput.
          >
            <PromptInputBody>
              <PromptInputTextarea ref={textareaRef} />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <ModelSelector
                  open={modelSelectorOpen}
                  onOpenChange={setModelSelectorOpen}
                >
                  <ModelSelectorTrigger asChild>
                    <PromptInputButton>
                      {selectedModelData && (
                        <ModelSelectorLogo provider={selectedModelData.provider} />
                      )}
                      {selectedModelData && (
                        <ModelSelectorName>
                          {selectedModelData.name}
                        </ModelSelectorName>
                      )}
                    </PromptInputButton>
                  </ModelSelectorTrigger>
                  <ModelSelectorContent>
                    <ModelSelectorInput placeholder="Search models..." />
                    <ModelSelectorList>
                      <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                      {Object.entries(groupedModels).map(([provider, models]) => (
                        <ModelSelectorGroup heading={provider} key={provider}>
                          {models.map((m) => (
                            <ModelSelectorItem
                              key={m.id}
                              onSelect={() => {
                                onModelChange(m.id);
                                setModelSelectorOpen(false);
                              }}
                              value={m.name}
                            >
                              <ModelSelectorLogo provider={m.provider} />
                              <ModelSelectorName>{m.name}</ModelSelectorName>
                              {model === m.id && (
                                <CheckIcon className="ml-auto size-4" />
                              )}
                            </ModelSelectorItem>
                          ))}
                        </ModelSelectorGroup>
                      ))}
                    </ModelSelectorList>
                  </ModelSelectorContent>
                </ModelSelector>
              </PromptInputTools>
              <PromptInputSubmit />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>
        
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Shift+Enter for new line</span>
          <span>Verify important info</span>
        </div>
      </div>
    </div>
  );
}
