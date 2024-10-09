import React from 'react';

const ActiveComponentContext = React.createContext({
  activeComponent: 'trivia',
  setActiveComponent: () => {}
});

export default ActiveComponentContext;
