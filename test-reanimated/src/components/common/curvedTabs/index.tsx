import React, { useEffect, useState } from "react";
import {
  Dimensions, Keyboard, Platform, Pressable, StyleSheet, Text, View,
} from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop,
} from "react-native-svg";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { CurvedTabBarNavigationProps, Tab } from "./types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TAB_HEIGHT = Platform.OS === "android" ? 65 : 58;
const ICON_SIZE = 24;
const FLOAT_OFFSET = -40;
const WRAPPER_HEIGHT = TAB_HEIGHT + 34;

// ── Curva SVG ──────────────────────────────────────────────────────────────
function CurveBackground({
  tabCount,
  activeIndex,
  gradient,
}: {
  tabCount: number;
  activeIndex: number;
  gradient: [string, string];
}) {
  const tabWidth = SCREEN_WIDTH / tabCount;
  const centerX = tabWidth * activeIndex + tabWidth / 2;

  const notchW = 180;
  const notchH = 22;
  const l = centerX - notchW / 2;
  const r = centerX + notchW / 2;
  const lc1 = l + notchW * 0.3;
  const lc2 = l + notchW * 0.38;
  const rc1 = r - notchW * 0.38;
  const rc2 = r - notchW * 0.3;

  const path = `
    M0 0
    L${l} 0
    C${lc1} 0 ${lc2} ${notchH} ${centerX} ${notchH}
    C${rc1} ${notchH} ${rc2} 0 ${r} 0
    L${SCREEN_WIDTH} 0
    V${TAB_HEIGHT}
    H0
    Z
  `;

  return (
    <Svg
      width={SCREEN_WIDTH}
      height={TAB_HEIGHT}
      style={{ position: "absolute", bottom: 0 }}
    >
      <Defs>
        <SvgGradient id="bg" x1="0" y1="0" x2={SCREEN_WIDTH} y2="0" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={gradient[0]} />
          <Stop offset="1" stopColor={gradient[1]} />
        </SvgGradient>
      </Defs>
      <Path d={path} fill="url(#bg)" />
    </Svg>
  );
}

// ── Ícone flutuante (tab activa) ───────────────────────────────────────────
function FloatingIcon({
  icon,
  gradient,
  badge,
}: {
  icon: React.ReactNode;
  gradient: [string, string];
  badge?: number;
}) {
  const size = 56;
  return (
    <View style={{
      alignItems: "center",
      justifyContent: "center",
      width: size + 4,
      height: size + 4,
      borderRadius: (size + 4) / 2,
      backgroundColor: "#1F2933",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="btn" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradient[0]} />
            <Stop offset="100%" stopColor={gradient[1]} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="url(#btn)" />
      </Svg>
      <View style={StyleSheet.absoluteFill as any} pointerEvents="none">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          {icon}
        </View>
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      )}
    </View>
  );
}

// ── Tab individual ─────────────────────────────────────────────────────────
function TabItem({
  tab,
  isActive,
  onPress,
  gradient,
}: {
  tab: Tab;
  isActive: boolean;
  onPress: () => void;
  gradient: [string, string];
}) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(isActive ? FLOAT_OFFSET : 0, {
      damping: 25,
      stiffness: 130,
    });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Pressable onPress={onPress} style={styles.tabItem}>
      <Animated.View style={animatedStyle}>
        {isActive ? (
          <FloatingIcon icon={tab.icon} gradient={gradient} badge={tab.badge} />
        ) : (
          <View style={styles.inactiveIcon}>
            {tab.icon}
            {tab.badge !== undefined && tab.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {tab.badge > 99 ? "99+" : tab.badge}
                </Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>

      {!isActive && (
        <Text style={styles.label}>{tab.title}</Text>
      )}
    </Pressable>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
function CurvedBottomTabsCore({
  tabs,
  currentIndex,
  onPress,
  gradient = ["#1F2933", "#2D3748"],
  hideWhenKeyboardShown = true,
}: {
  tabs: Tab[];
  currentIndex: number;
  onPress: (index: number) => void;
  gradient?: [string, string];
  hideWhenKeyboardShown?: boolean;
}) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!hideWhenKeyboardShown) return;
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, [hideWhenKeyboardShown]);

  if (hideWhenKeyboardShown && keyboardVisible) return null;

  return (
    <View style={styles.wrapper}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <CurveBackground
          tabCount={tabs.length}
          activeIndex={currentIndex}
          gradient={gradient}
        />
      </View>

      {tabs.map((tab, index) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={currentIndex === index}
          onPress={() => onPress(index)}
          gradient={gradient}
        />
      ))}
    </View>
  );
}

// ── Export para React Navigation ───────────────────────────────────────────
export function CurvedBottomTabs({
  state,
  descriptors,
  navigation,
  gradients = ["#1F2933", "#2D3748"],
}: BottomTabBarProps & CurvedTabBarNavigationProps) {
  const tabs: Tab[] = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const isActive = state.index === index;
    return {
      id: route.key,
      title:
        typeof options.tabBarLabel === "string"
          ? options.tabBarLabel
          : options.title ?? route.name,
      icon: options?.tabBarIcon?.({
        focused: isActive,
        color: isActive ? "#fff" : "#ffffff70",
        size: ICON_SIZE,
      }) ?? null,
      badge:
        typeof options.tabBarBadge === "number"
          ? options.tabBarBadge
          : undefined,
    };
  });

  const handlePress = (index: number) => {
    const route = state.routes[index];
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (state.index !== index && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  return (
    <CurvedBottomTabsCore
      tabs={tabs}
      currentIndex={state.index}
      onPress={handlePress}
      gradient={gradients as [string, string]}
    />
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: WRAPPER_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-end",
    zIndex: 9999,
    elevation: 9999,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: Platform.OS === "ios" ? 14 : 8,
    height: WRAPPER_HEIGHT,
  },
  inactiveIcon: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#ffffff80",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#ff4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },
});

export const TAB_BAR_HEIGHT = WRAPPER_HEIGHT;