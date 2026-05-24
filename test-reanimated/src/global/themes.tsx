// ─── Tipos ───────────────────────────────────────────────────────────────────
export interface AppTheme {
  colors: {
    background: string;
    surface: string;
    card: string;
    primary: string;
    secondary: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
      inverse: string;
    };
    error: string;
    success: string;
    warning: string;
    divider: string;
    danger: string;
    white: string;
    gray: string;
    lightGray: string;
    red: string;
    gradientBlueStart: string;
    gradientBlueEnd: string;
    buttonGoogle1: string;
    buttonGoogle2: string;
    buttonGoogle3: string;
  };
  fonts: {
    poppinsBold: string;
    poppinsSemi: string;
    poppinsMedium: string;
    poppinsRegular: string;
    poppinsLight: string;
    outfitSemiBold: string;
    outfitMedium: string;
    outfitRegular: string;
    outfitLight: string;
  };
  spacing: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

// ─── Tema Escuro ─────────────────────────────────────────────────────────────
export const darkTheme: AppTheme = {
  colors: {
    background: '#0D1117',
    surface: '#161B22',
    card: '#1C2333',
    primary: '#3461FD',
    secondary: '#1E2530',
    border: '#2D3748',
    text: {
      primary: '#FFFFFF',
      secondary: '#E2E8F0',
      muted: '#8B949E',
      inverse: '#0D1117',
    },
    error: '#CB1D00',
    success: '#34C759',
    warning: '#F59E0B',
    divider: '#2D3748',
    danger: '#EF4444',
    white: '#FFFFFF',
    gray: '#737373',
    lightGray: '#A1A1A1',
    red: '#CB1D00',
    gradientBlueStart: '#00BBFF',
    gradientBlueEnd: '#0077FF',
    buttonGoogle1: '#131D2C',
    buttonGoogle2: '#101824',
    buttonGoogle3: '#0B1422',
  },
  fonts: {
    poppinsBold: 'Poppins_700Bold',
    poppinsSemi: 'Poppins_600SemiBold',
    poppinsMedium: 'Poppins_500Medium',
    poppinsRegular: 'Poppins_400Regular',
    poppinsLight: 'Poppins_300Light',
    outfitSemiBold: 'Outfit_600SemiBold',
    outfitMedium: 'Outfit_500Medium',
    outfitRegular: 'Outfit_400Regular',
    outfitLight: 'Outfit_300Light',
  },
  spacing: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

// ─── Tema Claro ──────────────────────────────────────────────────────────────
export const lightTheme: AppTheme = {
  colors: {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    primary: '#3461FD',
    secondary: '#E8EDF4',
    border: '#E2E8F0',
    text: {
      primary: '#1A202C',
      secondary: '#4A5568',
      muted: '#A0AEC0',
      inverse: '#FFFFFF',
    },
    error: '#E53E3E',
    success: '#38A169',
    warning: '#DD6B20',
    divider: '#E2E8F0',
    danger: '#EF4444',
    white: '#FFFFFF',
    gray: '#737373',
    lightGray: '#A1A1A1',
    red: '#E53E3E',
    gradientBlueStart: '#00BBFF',
    gradientBlueEnd: '#0077FF',
    buttonGoogle1: '#F0F4F8',
    buttonGoogle2: '#E8EDF4',
    buttonGoogle3: '#DDE5EE',
  },
  fonts: {
    poppinsBold: 'Poppins_700Bold',
    poppinsSemi: 'Poppins_600SemiBold',
    poppinsMedium: 'Poppins_500Medium',
    poppinsRegular: 'Poppins_400Regular',
    poppinsLight: 'Poppins_300Light',
    outfitSemiBold: 'Outfit_600SemiBold',
    outfitMedium: 'Outfit_500Medium',
    outfitRegular: 'Outfit_400Regular',
    outfitLight: 'Outfit_300Light',
  },
  spacing: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

// ─── Legacy (mantido para compatibilidade) ───────────────────────────────────
export const themes = {
  colors: {
    background: '#0D1117',
    primary: '#3461FD',
    white: '#FFFFFF',
    gray: '#737373',
    lightGray: '#A1A1A1',
    buttonGoogle1: '#131D2C',
    buttonGoogle2: '#101824',
    buttonGoogle3: '#0B1422',
    text: {
      primary: '#FFFFFF',
      secondary: '#EEEEEE',
      dark: '#121212',
      gray: '#EEEEEE',
    },
    red: '#CB1D00',
    gradientBlueStart: '#00BBFF',
    gradientBlueEnd: '#0077FF',
  },
  fonts: darkTheme.fonts,
  spacing: darkTheme.spacing,
};