// src/context/AppContext.jsx
import { createContext, useReducer } from "react";
import { reducer } from "../reducer/reducer";
import { initialState } from "../reducer/initialState";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const [appstate, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ appstate, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
