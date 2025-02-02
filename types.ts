// types.ts
export interface Folder {
    id: string;
    name: string;
    children: Folder[];
    isCollapsed: boolean;
  }
  