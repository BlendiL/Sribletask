import React, { useState, useRef, useEffect } from 'react';
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { TreeItem } from './types';
import { FaFolder, FaFolderOpen, FaFileAlt, FaEdit, FaTrash, FaCaretRight, FaCaretDown } from 'react-icons/fa';

export type MovePosition = 'before' | 'after' | 'inside';

interface FolderItemProps {
  item: TreeItem;
  depth: number;
  onRename: (id: string, newName: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (dragId: string, targetId: string, position: MovePosition) => void;
}

const ITEM_TYPE = 'TREE_ITEM';

interface DragItem {
  id: string;
  type: string;
}

const FolderItem: React.FC<FolderItemProps> = ({
  item,
  depth,
  onRename,
  onToggle,
  onDelete,
  onMove,
}) => {
  const [isEditing, setIsEditing] = useState(item.name === '');
  const [tempName, setTempName] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  const variants = {
    idle: { scale: 1 },
    dragging: { scale: 1.05, zIndex: 10 },
  };

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id: item.id },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
    drop: (dragItem: DragItem, monitor: DropTargetMonitor) => {
      if (!ref.current) return;
      if (dragItem.id === item.id) return;
      const clientOffset = monitor.getClientOffset();
      const boundingRect = ref.current.getBoundingClientRect();
      if (!clientOffset) return;
      const relativeY = clientOffset.y - boundingRect.top;
      const relativeX = clientOffset.x - boundingRect.left;
      const height = boundingRect.height;
      if (relativeX > 20 && item.type === 'folder') {
        onMove(dragItem.id, item.id, 'inside');
      } else {
        const position: MovePosition = relativeY < height / 2 ? 'before' : 'after';
        onMove(dragItem.id, item.id, position);
      }
    },
  });

  drag(drop(ref));

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') finishEditing();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setTempName(item.name);
    }
  };

  const finishEditing = () => {
    setIsEditing(false);
    onRename(item.id, tempName.trim() === '' ? (item.type === 'folder' ? 'Untitled Folder' : 'Untitled File') : tempName);
  };

  const renderIcon = () => {
    if (item.type === 'folder') {
      return item.isCollapsed ? (
        <FaFolder className="text-purple-500 mr-2" />
      ) : (
        <FaFolderOpen className="text-purple-500 mr-2" />
      );
    }
    return <FaFileAlt className="text-purple-500 mr-2" />;
  };

  const renderToggleArrow = () => {
    if (item.type !== 'folder') return null;
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
        className="mr-2 focus:outline-none transition-transform duration-150"
      >
        {item.isCollapsed ? <FaCaretRight /> : <FaCaretDown />}
      </button>
    );
  };

  return (
    <motion.div
      ref={ref}
      className={`my-1 pl-${depth * 4} transition-all duration-200 ease-in-out ${isOver ? 'bg-purple-100' : ''} ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      variants={variants}
      animate={isDragging ? 'dragging' : 'idle'}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: isDragging ? 1.05 : 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center group p-2 hover:bg-gray-100 rounded">
        {renderToggleArrow()}
        {renderIcon()}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={finishEditing}
            className="border-b border-blue-500 focus:outline-none"
          />
        ) : (
          <span onDoubleClick={() => setIsEditing(true)} className="select-none">
            {item.name || (item.type === 'folder' ? 'Untitled Folder' : 'Untitled File')}
          </span>
        )}
        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            className="text-purple-500 hover:text-purple-700 transform hover:scale-105 transition-transform duration-150 focus:outline-none"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-500 hover:text-red-700 transform hover:scale-105 transition-transform duration-150 focus:outline-none"
          >
            <FaTrash />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {item.type === 'folder' && !item.isCollapsed && item.children && item.children.length > 0 && (
          <motion.div
            className="ml-6 border-l pl-2"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {item.children.map(child => (
              <FolderItem
                key={child.id}
                item={child}
                depth={depth + 1}
                onRename={onRename}
                onToggle={onToggle}
                onDelete={onDelete}
                onMove={onMove}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FolderItem;
