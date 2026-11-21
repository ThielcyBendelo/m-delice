import React, { createContext, useContext, useState } from 'react';

const NavigationContext = createContext({
  isNavbarOpen: false,
  setIsNavbarOpen: () => {},
});

export const NavigationProvider = ({ children }) => {
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);

  return (
    <NavigationContext.Provider value={{ isNavbarOpen, setIsNavbarOpen }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation doit être utilisé à l’intérieur d’un NavigationProvider');
  }
  return context;
};
