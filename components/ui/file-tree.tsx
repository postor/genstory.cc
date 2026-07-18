"use client";

import { useState, type ReactNode } from "react";
import { FileIcon, FolderIcon, FolderOpenIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export type TreeViewElement = {
  id: string;
  name: string;
  type?: "file" | "folder";
  isSelectable?: boolean;
  children?: TreeViewElement[];
};

type TreeProps = {
  elements: TreeViewElement[];
  initialExpandedItems?: string[];
  initialSelectedId?: string;
  onSelect?: (id: string) => void;
  fileIcon?: ReactNode;
  folderOpenIcon?: ReactNode;
  folderClosedIcon?: ReactNode;
  className?: string;
};

const isFolder = (el: TreeViewElement) =>
  el.type === "folder" || Array.isArray(el.children);

export function Tree({
  elements,
  initialExpandedItems = [],
  initialSelectedId,
  onSelect,
  fileIcon,
  folderOpenIcon,
  folderClosedIcon,
  className,
}: TreeProps) {
  const [expanded, setExpanded] = useState<string[]>(initialExpandedItems);
  const [selected, setSelected] = useState<string | undefined>(initialSelectedId);

  function toggle(id: string) {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function select(id: string) {
    setSelected(id);
    onSelect?.(id);
  }

  function renderItem(el: TreeViewElement): ReactNode {
    const folder = isFolder(el);
    const isOpen = expanded.includes(el.id);
    const isSelected = selected === el.id;

    if (folder) {
      return (
        <div key={el.id}>
          <button
            type="button"
            onClick={() => {
              toggle(el.id);
              select(el.id);
            }}
            className={cn(
              "flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 pl-2 text-sm transition-colors",
              isSelected
                ? "bg-primary/10 font-medium text-primary"
                : "text-foreground hover:bg-muted"
            )}
          >
            {isOpen
              ? (folderOpenIcon ?? <FolderOpenIcon className="size-4 text-muted-foreground" />)
              : (folderClosedIcon ?? <FolderIcon className="size-4 text-muted-foreground" />)}
            <span className="truncate">{el.name}</span>
          </button>
          {isOpen && el.children && (
            <div className="pl-3">{el.children.map((child) => renderItem(child))}</div>
          )}
        </div>
      );
    }

    return (
      <button
        key={el.id}
        type="button"
        onClick={() => select(el.id)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 pl-2 text-sm transition-colors",
          isSelected
            ? "bg-primary/10 font-medium text-primary"
            : "text-foreground hover:bg-muted"
        )}
      >
        {fileIcon ?? <FileIcon className="size-4 text-muted-foreground" />}
        <span className="truncate">{el.name}</span>
      </button>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="py-1">{elements.map((el) => renderItem(el))}</div>
    </ScrollArea>
  );
}

export type { TreeViewElement as TreeElement };
