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
  renderActions?: (element: TreeViewElement) => ReactNode;
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
  renderActions,
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
    const itemClasses = cn(
      "flex min-w-0 flex-1 items-center gap-1.5 rounded-md py-1.5 pr-2 pl-2 text-sm transition-colors",
      isSelected
        ? "bg-primary/10 font-medium text-primary"
        : "text-foreground hover:bg-muted"
    );
    const actions = renderActions ? (
      <div
        className="ml-1 flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity group-hover/tree-item:opacity-100 group-focus-within/tree-item:opacity-100"
        onClick={(event) => event.stopPropagation()}
      >
        {renderActions?.(el)}
      </div>
    ) : null;

    if (folder) {
      return (
        <div key={el.id}>
          <div className="group/tree-item flex items-center">
            <button
              type="button"
              onClick={() => {
                toggle(el.id);
                select(el.id);
              }}
              className={itemClasses}
            >
              {isOpen
                ? (folderOpenIcon ?? <FolderOpenIcon className="size-4 text-muted-foreground" />)
                : (folderClosedIcon ?? <FolderIcon className="size-4 text-muted-foreground" />)}
              <span className="truncate">{el.name}</span>
            </button>
            {actions}
          </div>
          {isOpen && el.children && (
            <div className="pl-3">{el.children.map((child) => renderItem(child))}</div>
          )}
        </div>
      );
    }

    return (
      <div key={el.id} className="group/tree-item flex items-center">
        <button type="button" onClick={() => select(el.id)} className={itemClasses}>
          {fileIcon ?? <FileIcon className="size-4 text-muted-foreground" />}
          <span className="truncate">{el.name}</span>
        </button>
        {actions}
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="py-1">{elements.map((el) => renderItem(el))}</div>
    </ScrollArea>
  );
}

export type { TreeViewElement as TreeElement };
