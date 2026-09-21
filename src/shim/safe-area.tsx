import React, { createContext, useContext } from 'react';
import { View } from './react-native';

export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const defaultInsets: EdgeInsets = {
  top: 48,
  bottom: 34,
  left: 0,
  right: 0,
};

const SafeAreaInsetsContext = createContext<EdgeInsets>(defaultInsets);

export const SafeAreaProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SafeAreaInsetsContext.Provider value={defaultInsets}>
      {children}
    </SafeAreaInsetsContext.Provider>
  );
};

export const useSafeAreaInsets = (): EdgeInsets => {
  return useContext(SafeAreaInsetsContext) || defaultInsets;
};

export const SafeAreaView = ({ style, children, id, ...rest }: any) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      id={id}
      style={[
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          flex: 1,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};
