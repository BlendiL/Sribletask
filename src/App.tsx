import React from 'react';
import FolderTree from './FolderTree';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const App: React.FC = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto mt-10 max-w-3xl p-6 bg-white rounded shadow-lg">
        <FolderTree />
      </div>
    </DndProvider>
  );
};

export default App;
