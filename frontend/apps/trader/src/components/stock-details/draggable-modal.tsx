"use client";

import { useState, type ReactNode, type CSSProperties } from "react";
import { DndContext, useDraggable, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal, X, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface DraggableModalProps {
  children: ReactNode;
  title: string;
  defaultPosition?: { x: number; y: number };
  onClose?: () => void;
  className?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

function DraggableContent({
  children,
  title,
  onClose,
  className,
  isMinimized,
  onToggleMinimize,
}: DraggableModalProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "draggable-modal",
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "absolute z-[100] rounded-xl border border-[#2d303a]/60 bg-[#12141a] shadow-2xl",
        "transition-all duration-200",
        isMinimized ? "w-[280px]" : "w-[400px] max-h-[85vh]",
        className
      )}
    >
      {/* Header - Draggable Handle */}
      <div
        {...listeners}
        {...attributes}
        className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#2d303a]/40 cursor-grab active:cursor-grabbing rounded-t-xl bg-[#0c0d10]/80 select-none"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-4 w-4 text-[#5c606c]" />
          <span className="text-sm font-medium text-[#e8eaed]">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMinimize}
            className="p-1.5 rounded-md hover:bg-[#1e2028] transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="h-3.5 w-3.5 text-[#8b8f9a]" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5 text-[#8b8f9a]" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-[#f06c6c]/20 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-[#8b8f9a] hover:text-[#f06c6c]" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="overflow-y-auto max-h-[calc(85vh-48px)] custom-scrollbar bg-[#12141a]">
          {children}
        </div>
      )}
    </div>
  );
}

export function DraggableModal({
  children,
  title,
  defaultPosition = { x: 20, y: 20 },
  onClose,
  className,
}: Omit<DraggableModalProps, "isMinimized" | "onToggleMinimize">) {
  const [position, setPosition] = useState(defaultPosition);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta } = event;
    setPosition((prev) => ({
      x: prev.x + delta.x,
      y: prev.y + delta.y,
    }));
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        style={{
          position: "absolute",
          left: position.x,
          top: position.y,
          zIndex: 100,
        }}
      >
        <DraggableContent
          title={title}
          onClose={onClose}
          className={className}
          isMinimized={isMinimized}
          onToggleMinimize={() => setIsMinimized(!isMinimized)}
        >
          {children}
        </DraggableContent>
      </div>
    </DndContext>
  );
}
