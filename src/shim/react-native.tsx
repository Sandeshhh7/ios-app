import React, { forwardRef, useState, useEffect } from 'react';

// Helper to flatten React Native style objects or arrays
export function flattenStyle(style: any): React.CSSProperties {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce((acc, curr) => ({ ...acc, ...flattenStyle(curr) }), {});
  }
  const css: Record<string, any> = {};
  for (const [key, val] of Object.entries(style)) {
    if (val === undefined || val === null) continue;
    // Map standard RN styles to CSS
    if (key === 'elevation') continue;
    if (key === 'shadowColor' || key === 'shadowOffset' || key === 'shadowOpacity' || key === 'shadowRadius') continue;
    if (key === 'marginHorizontal') {
      css.marginLeft = val;
      css.marginRight = val;
    } else if (key === 'marginVertical') {
      css.marginTop = val;
      css.marginBottom = val;
    } else if (key === 'paddingHorizontal') {
      css.paddingLeft = val;
      css.paddingRight = val;
    } else if (key === 'paddingVertical') {
      css.paddingTop = val;
      css.paddingBottom = val;
    } else if (key === 'tintColor') {
      css.color = val;
    } else {
      css[key] = val;
    }
  }
  return css as React.CSSProperties;
}

export const StyleSheet = {
  create: <T extends Record<string, any>>(styles: T): T => styles,
  flatten: (s: any) => flattenStyle(s),
  hairlineWidth: 1,
};

export const Platform = {
  OS: 'ios' as 'ios' | 'android' | 'web' | 'windows' | 'macos',
  select: (obj: any) => (obj && 'ios' in obj ? obj.ios : obj?.default),
  isPad: false,
};

export const Dimensions = {
  get: (type: 'window' | 'screen') => ({
    width: 390,
    height: 844,
    scale: 3,
    fontScale: 1,
  }),
};

export const StatusBar: React.FC<any> = (props: any) => null;

export const View = forwardRef<HTMLDivElement, any>(({ style, children, id, ...rest }, ref) => {
  const flattened = flattenStyle(style);
  return (
    <div
      ref={ref}
      id={id}
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxSizing: 'border-box',
        borderWidth: 0,
        borderStyle: 'solid',
        minHeight: 0,
        minWidth: 0,
        ...flattened,
      }}
      {...rest}
    >
      {children}
    </div>
  );
});

export const Text = forwardRef<HTMLSpanElement, any>(({ style, children, numberOfLines, id, ...rest }, ref) => {
  const flattened = flattenStyle(style);
  const lineClampStyle: React.CSSProperties = numberOfLines
    ? {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: numberOfLines,
        WebkitBoxOrient: 'vertical',
      }
    : {};

  return (
    <span
      ref={ref}
      id={id}
      style={{
        boxSizing: 'border-box',
        color: '#FFFFFF',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
        ...lineClampStyle,
        ...flattened,
      }}
      {...rest}
    >
      {children}
    </span>
  );
});

export const Pressable = forwardRef<HTMLDivElement, any>(({ style, children, onPress, disabled, id, ...rest }, ref) => {
  const [pressed, setPressed] = useState(false);
  const computedStyle = typeof style === 'function' ? style({ pressed }) : style;
  const flattened = flattenStyle(computedStyle);

  return (
    <div
      ref={ref}
      id={id}
      onClick={(e) => {
        if (!disabled && onPress) {
          e.stopPropagation();
          onPress();
        }
      }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        cursor: disabled ? 'default' : 'pointer',
        userSelect: 'none',
        opacity: pressed ? 0.75 : 1,
        transition: 'opacity 0.15s ease, transform 0.15s ease',
        ...flattened,
      }}
      {...rest}
    >
      {typeof children === 'function' ? children({ pressed }) : children}
    </div>
  );
});

export const ScrollView = forwardRef<HTMLDivElement, any>(({ style, contentContainerStyle, children, horizontal, showsVerticalScrollIndicator = false, id, ...rest }, ref) => {
  const flattened = flattenStyle(style);
  const contentFlattened = flattenStyle(contentContainerStyle);

  return (
    <div
      ref={ref}
      id={id}
      style={{
        display: 'flex',
        flexDirection: horizontal ? 'row' : 'column',
        overflowX: horizontal ? 'auto' : 'hidden',
        overflowY: horizontal ? 'hidden' : 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: showsVerticalScrollIndicator ? 'auto' : 'none',
        ...flattened,
      }}
      {...rest}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: horizontal ? 'row' : 'column',
          minWidth: horizontal ? 'max-content' : '100%',
          ...contentFlattened,
        }}
      >
        {children}
      </div>
    </div>
  );
});

export const FlatList = ({
  data,
  renderItem,
  keyExtractor = (item: any, idx: number) => item?.id || String(idx),
  style,
  contentContainerStyle,
  ListHeaderComponent,
  ListEmptyComponent,
  id,
  ...rest
}: any) => {
  const flattened = flattenStyle(style);
  const contentFlattened = flattenStyle(contentContainerStyle);

  return (
    <div
      id={id}
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        ...flattened,
      }}
      {...rest}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          ...contentFlattened,
        }}
      >
        {ListHeaderComponent && (typeof ListHeaderComponent === 'function' ? <ListHeaderComponent /> : ListHeaderComponent)}
        {data && data.length > 0
          ? data.map((item: any, index: number) => (
              <React.Fragment key={keyExtractor(item, index)}>
                {renderItem({ item, index })}
              </React.Fragment>
            ))
          : ListEmptyComponent && (typeof ListEmptyComponent === 'function' ? <ListEmptyComponent /> : ListEmptyComponent)}
      </div>
    </div>
  );
};

export const Image = ({ source, style, resizeMode = 'cover', id, ...rest }: any) => {
  const flattened = flattenStyle(style);
  const uri = typeof source === 'object' && source?.uri ? source.uri : source;
  return (
    <img
      id={id}
      src={uri}
      alt=""
      style={{
        objectFit: resizeMode,
        display: 'block',
        ...flattened,
      }}
      {...rest}
    />
  );
};

// Animated mock for standard React Native Animated API
export const Animated = {
  Value: class {
    private val: number;
    private listeners: ((val: number) => void)[] = [];
    constructor(v: number) {
      this.val = v;
    }
    setValue(v: number) {
      this.val = v;
      this.listeners.forEach((l) => l(v));
    }
    interpolate(config: { inputRange: number[]; outputRange: number[] | string[] }) {
      return this.val;
    }
    addListener(callback: (state: { value: number }) => void) {
      const listener = (v: number) => callback({ value: v });
      this.listeners.push(listener);
      return String(this.listeners.length);
    }
    removeAllListeners() {
      this.listeners = [];
    }
  },
  timing: (val: any, config: any) => ({
    start: (callback?: any) => {
      val.setValue(config.toValue);
      if (callback) callback({ finished: true });
    },
    stop: () => {},
  }),
  spring: (val: any, config: any) => ({
    start: (callback?: any) => {
      val.setValue(config.toValue);
      if (callback) callback({ finished: true });
    },
    stop: () => {},
  }),
  sequence: (anims: any[]) => ({
    start: (callback?: any) => {
      anims.forEach((a) => a.start());
      if (callback) callback({ finished: true });
    },
    stop: () => {},
  }),
  loop: (anim: any) => ({
    start: () => anim.start(),
    stop: () => {},
  }),
  View: View,
  Text: Text,
  Image: Image,
};
