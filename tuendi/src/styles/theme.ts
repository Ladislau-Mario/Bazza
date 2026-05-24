import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

export const theme = extendTheme({
  config,

  fonts: {
    heading: "var(--dm_sans)",
    body: "var(--outfit)",
  },

  fontSizes: {
    sxs: "11px",
    xs: "12px",
    sm: "14px",
    md: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px",
    "5xl": "48px",
  },

  fontWeights: {
    extraLight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeights: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2",
  },

  letterSpacings: {
    tight: "-0.02em",
    normal: "0",
    spaced: "0.02em",
    wide: "0.05em",
  },

  colors: {
    brand: {
      50:  "#F5F0FF",
      100: "#EDE0FF",
      200: "#D4BBFF",
      300: "#B794F4",
      400: "#9F7AEA",
      500: "#C026D3",
      // 500: "#7C3AED", // roxo principal
      600: "#6D28D9",
      700: "#5B21B6",
      800: "#4C1D95",
      900: "#3B0764",
    },

    accent: {
      pink:    "#D946EF",
      magenta: "#C026D3",
      purple:  "#7C3AED",
      blue:    "#3B82F6",
      cyan:    "#06B6D4",
    },

    gradient: {
      primary: "linear-gradient(135deg, #7C3AED 0%, #D946EF 100%)",
      secondary: "linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%)",
      card: "linear-gradient(135deg, #1e213a 0%, #12152B 100%)",
    },

    navy: {
      950: "#070f24", // body bg
      900: "#0A1330", // background principal
      800: "#12152B", // sidebar / secundário
      700: "#0B1739", // cards
      600: "#1E2340", // cards hover / inputs
      500: "#343B4F", // bordas
      400: "#2E3560", // bordas hover
    },

    grayDark: {
      900: "#080A14",
      800: "#0D0F1C",
      700: "#12152B",
      600: "#171B35",
      500: "#1E2340",
    },

    light: {
      bg: "#F5F5F7",
      bgSecondary: "#FFFFFF",
      bgCard: "#FFFFFF",
      bgHover: "#F0F0F5",
      textPrimary: "#1A1A2E",
      textSecondary: "#6B7280",
      textMuted: "#9CA3AF",
      border: "#E5E7EB",
      borderSubtle: "#D1D5DB",
    },

    status: {
      success: "#22C55E",
      warning: "#FACC15",
      danger:  "#EF4444",
      info:    "#3B82F6",
    },
  },

  semanticTokens: {
    colors: {
      bg: {
        default:   { _dark: "navy.950", _light: "#F5F5F7" },
        secondary: { _dark: "navy.800", _light: "#FFFFFF" },
        card:      { _dark: "navy.700", _light: "#FFFFFF" },
        hover:     { _dark: "navy.600", _light: "#F0F0F5" },
      },

      text: {
        primary:   { _dark: "#E8EAFF", _light: "#1A1A2E" },
        secondary: { _dark: "#8B90B8", _light: "#6B7280" },
        muted:     { _dark: "#AEB9E1", _light: "#9CA3AF" },
      },

      border: {
        default: { _dark: "navy.600", _light: "#E5E7EB" },
        subtle:  { _dark: "navy.500", _light: "#D1D5DB" },
      },
    },
  },

  styles: {
    global: {
      body: {
        bg: "bg.default",
        color: "text.primary",
      },
      "*": {
        borderColor: "border.default",
      },
    },
  },

  components: {
    Card: {
      baseStyle: {
        container: {
          bg: "bg.card",
          borderRadius: "xl",
          border: "1px solid",
          borderColor: "border.default",
        },
      },
    },

    Button: {
      variants: {
        gradient: {
          bgGradient: "linear(to-r, brand.500, accent.pink)",
          color: "white",
          _hover: {
            bgGradient: "linear(to-r, brand.600, accent.magenta)",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4)",
          },
          _active: {
            transform: "translateY(0)",
          },
          transition: "all 0.2s",
        },

        ghost: {
          color: "text.secondary",
          _hover: {
            bg: "bg.hover",
            color: "text.primary",
          },
        },

        outline: {
          borderColor: "border.default",
          color: "text.primary",
          _hover: {
            bg: "bg.hover",
            borderColor: "border.subtle",
          },
        },
      },
    },

    Input: {
      variants: {
        filled: {
          field: {
            bg: "bg.hover",
            borderColor: "transparent",
            _hover: {
              bg: "bg.card",
              borderColor: "border.subtle",
            },
            _focus: {
              bg: "bg.hover",
              borderColor: "brand.500",
              boxShadow: "0 0 0 1px #7C3AED",
            },
          },
        },
      },
      defaultProps: {
        variant: "filled",
      },
    },

    Select: {
      variants: {
        filled: {
          field: {
            bg: "bg.hover",
            borderColor: "transparent",
            _hover: {
              bg: "bg.card",
            },
            _focus: {
              borderColor: "brand.500",
              boxShadow: "0 0 0 1px #7C3AED",
            },
          },
        },
      },
      defaultProps: {
        variant: "filled",
      },
    },

    Menu: {
      baseStyle: {
        list: {
          bg: "bg.secondary",
          borderColor: "border.default",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          fontFamily: "body",
        },
        item: {
          bg: "bg.secondary",
          color: "text.secondary",
          _hover: {
            bg: "bg.hover",
            color: "text.primary",
          },
          _focus: {
            bg: "bg.hover",
          },
        },
      },
    },

    Modal: {
      baseStyle: {
        dialog: {
          bg: "bg.secondary",
          borderColor: "border.default",
          border: "1px solid",
        },
        overlay: {
          backdropFilter: "blur(4px)",
        },
      },
    },

    Table: {
      variants: {
        simple: {
          th: {
            color: "text.muted",
            borderColor: "border.default",
            fontSize: "xs",
            textTransform: "uppercase",
            letterSpacing: "wide",
          },
          td: {
            borderColor: "border.default",
            fontSize: "sm",
          },
          tr: {
            _hover: {
              bg: "bg.hover",
            },
          },
        },
      },
    },

    Tabs: {
      variants: {
        "soft-rounded": {
          tab: {
            color: "text.muted",
            _selected: {
              bg: "bg.hover",
              color: "text.primary",
            },
          },
        },
      },
    },

    Divider: {
      baseStyle: {
        borderColor: "border.default",
        opacity: 1,
      },
    },

    Tag: {
      baseStyle: {
        container: {
          fontSize: "xs",
          fontWeight: "medium",
        },
      },
    },
  },
});