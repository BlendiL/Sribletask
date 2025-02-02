import React, { useState } from 'react';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import FolderItem from './FolderItem';
import { TreeItem } from './types';
import { FaPlus, FaFileAlt } from 'react-icons/fa';

export type MovePosition = 'before' | 'after' | 'inside';

interface DragItem {
  id: string;
  type: string;
}

const FolderTree: React.FC = () => {
  const [items, setItems] = useState<TreeItem[]>([]);

  const removeItemFromTree = (
    itemList: TreeItem[],
    itemId: string
  ): { tree: TreeItem[]; removed: TreeItem | null } => {
    let removedItem: TreeItem | null = null;
    const filtered = itemList.reduce<TreeItem[]>((acc, item) => {
      if (item.id === itemId) {
        removedItem = item;
        return acc;
      }
      if (item.type === 'folder' && item.children) {
        const result = removeItemFromTree(item.children, itemId);
        item.children = result.tree;
        if (result.removed) {
          removedItem = result.removed;
        }
      }
      acc.push(item);
      return acc;
    }, []);
    return { tree: filtered, removed: removedItem };
  };

  const insertItemInTree = (
    itemList: TreeItem[],
    targetId: string,
    itemToInsert: TreeItem,
    position: MovePosition
  ): TreeItem[] => {
    return itemList.map((item) => {
      if (item.id === targetId && item.type === 'folder') {
        if (position === 'inside') {
          return {
            ...item,
            children: item.children ? [...item.children, itemToInsert] : [itemToInsert],
          };
        }
      }
      if (item.type === 'folder' && item.children) {
        return {
          ...item,
          children: insertItemInTree(item.children, targetId, itemToInsert, position),
        };
      }
      return item;
    }).reduce<TreeItem[]>((acc, item) => {
      if (item.id === targetId && (position === 'before' || position === 'after')) {
        if (position === 'before') {
          acc.push(itemToInsert);
          acc.push(item);
        } else {
          acc.push(item);
          acc.push(itemToInsert);
        }
      } else {
        acc.push(item);
      }
      return acc;
    }, []);
  };

  const handleMoveItem = (
    dragId: string,
    targetId: string,
    position: MovePosition
  ) => {
    if (dragId === targetId) return;
    const { tree: treeWithoutDragged, removed } = removeItemFromTree(items, dragId);
    if (!removed) return;

    const isDescendant = (parent: TreeItem, childId: string): boolean => {
      if (parent.id === childId) return true;
      if (parent.type === 'folder' && parent.children) {
        for (let child of parent.children) {
          if (isDescendant(child, childId)) return true;
        }
      }
      return false;
    };

    if (position === 'inside') {
      const findItem = (list: TreeItem[], id: string): TreeItem | null => {
        for (let itm of list) {
          if (itm.id === id) return itm;
          if (itm.type === 'folder' && itm.children) {
            const found = findItem(itm.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      const targetItem = findItem(treeWithoutDragged, targetId);
      if (targetItem && isDescendant(removed, targetId)) {
        return;
      }
    }

    const newTree = insertItemInTree(treeWithoutDragged, targetId, removed, position);
    setItems(newTree);
  };

  const handleMoveItemToRoot = (dragId: string) => {
    const { tree: treeWithoutDragged, removed } = removeItemFromTree(items, dragId);
    if (!removed) return;
    setItems([...treeWithoutDragged, removed]);
  };

  const [{ isOver: isOverContainer }, dropContainer] = useDrop({
    accept: 'TREE_ITEM',
    drop: (dragItem: DragItem, monitor: DropTargetMonitor) => {
      if (monitor.didDrop()) return;
      handleMoveItemToRoot(dragItem.id);
    },
  });

  const handleAddFolder = () => {
    const newFolder: TreeItem = {
      id: uuidv4(),
      name: '',
      type: 'folder',
      children: [],
      isCollapsed: false,
    };
    setItems(prev => [...prev, newFolder]);
  };

  const handleAddFile = () => {
    const newFile: TreeItem = {
      id: uuidv4(),
      name: '',
      type: 'file',
    };
    setItems(prev => [...prev, newFile]);
  };

  const handleRenameItem = (itemId: string, newName: string) => {
    const renameRecursive = (list: TreeItem[]): TreeItem[] => {
      return list.map(item => {
        if (item.id === itemId) {
          return { ...item, name: newName || (item.type === 'folder' ? 'Untitled Folder' : 'Untitled File') };
        }
        if (item.type === 'folder' && item.children) {
          return { ...item, children: renameRecursive(item.children) };
        }
        return item;
      });
    };
    setItems(prev => renameRecursive(prev));
  };

  const handleToggleItem = (itemId: string) => {
    const toggleRecursive = (list: TreeItem[]): TreeItem[] => {
      return list.map(item => {
        if (item.id === itemId && item.type === 'folder') {
          return { ...item, isCollapsed: !item.isCollapsed };
        }
        if (item.type === 'folder' && item.children) {
          return { ...item, children: toggleRecursive(item.children) };
        }
        return item;
      });
    };
    setItems(prev => toggleRecursive(prev));
  };

  const handleDeleteItem = (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item and all its sub-items?')) {
      return;
    }
    const deleteRecursive = (list: TreeItem[]): TreeItem[] => {
      return list
        .filter(item => item.id !== itemId)
        .map(item => item.type === 'folder' && item.children ? { ...item, children: deleteRecursive(item.children) } : item);
    };
    setItems(prev => deleteRecursive(prev));
  };

  return (
    <div className="p-4" ref={dropContainer}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Folder and File</h2>
        <div className="flex space-x-4">
          <button
            className="text-purple-500 font-semibold flex items-center hover:underline text-xl px-6 py-3"
            onClick={handleAddFolder}
          >
            <FaPlus className="mr-1" /> Folder
          </button>
          <button
            className="text-purple-500 font-semibold flex items-center hover:underline text-xl px-6 py-3"
            onClick={handleAddFile}
          >
            <FaFileAlt className="mr-1" /> File
          </button>
        </div>
      </div>
      <div>
        {items.map(item => (
          <FolderItem
            key={item.id}
            item={item}
            depth={0}
            onRename={handleRenameItem}
            onToggle={handleToggleItem}
            onDelete={handleDeleteItem}
            onMove={handleMoveItem}
          />
        ))}
      </div>
    </div>
  );
};

export default FolderTree;
