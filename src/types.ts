export interface TreeItem {
    id: string;
    name: string;
    type: 'folder' | 'file';
    children?: TreeItem[];
    isCollapsed?: boolean;
  }
  