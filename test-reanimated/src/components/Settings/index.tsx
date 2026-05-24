import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, StatusBar, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTheme } from '../../global/ThemeContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { authService } from '../modules/services/api/authService';
import api from '../modules/services/api/api';

interface Props {
  userType: 'client' | 'driver';
}

export default function SettingsScreen({ userType }: Props) {
  const navigation = useNavigation<any>();
  const { mode, theme, toggleTheme } = useTheme();
  const c = theme.colors;
  const f = theme.fonts;

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lang] = useState('Português');
  const [loading, setLoading] = useState(true);

  const isDriver = userType === 'driver';

  // Carregar preferências do backend
  useEffect(() => {
    api.get('/preferencias')
      .then((res) => {
        setNotifEnabled(res.data.notificacoesPush ?? true);
        setSoundEnabled(res.data.som ?? true);
      })
      .catch(() => {
        // Se falhar, usar defaults
      })
      .finally(() => setLoading(false));
  }, []);

  // Actualizar preferência no backend
  const updatePref = async (campo: string, valor: any) => {
    try {
      await api.patch('/preferencias', { [campo]: valor });
    } catch {
      // Silenciar erro — preferência fica apenas local
    }
  };

  const handleToggleNotif = (value: boolean) => {
    setNotifEnabled(value);
    updatePref('notificacoesPush', value);
  };

  const handleToggleSound = (value: boolean) => {
    setSoundEnabled(value);
    updatePref('som', value);
  };

  const handleLogout = () => {
    Alert.alert('Terminar Sessão', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try { await signOut(auth); } catch (_) {}
          await authService.limparSessao();
          navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
        },
      },
    ]);
  };

  const navigateTo = (route: string) => {
    navigation.navigate(route);
  };

  const renderToggle = (
    icon: string, iconColor: string, label: string,
    value: boolean, onToggle: (v: boolean) => void,
  ) => (
    <View style={[s.row, { backgroundColor: c.card }]}>
      <View style={[s.iconWrap, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={[s.rowLabel, { color: c.text.primary, fontFamily: f.poppinsMedium }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#374151', true: c.primary }}
        thumbColor="#fff"
      />
    </View>
  );

  const renderNav = (
    icon: string, iconColor: string, label: string, value: string, onPress?: () => void,
  ) => (
    <TouchableOpacity style={[s.row, { backgroundColor: c.card }]} activeOpacity={0.6} onPress={onPress}>
      <View style={[s.iconWrap, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, { color: c.text.primary, fontFamily: f.poppinsMedium }]}>{label}</Text>
        {value ? <Text style={[s.rowValue, { color: c.text.muted, fontFamily: f.poppinsRegular }]}>{value}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={c.text.muted} />
    </TouchableOpacity>
  );

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={s.header}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: c.card }]}
          onPress={() => {
            if (isDriver) navigation.goBack();
            else navigation.dispatch(DrawerActions.openDrawer());
          }}
        >
          <Ionicons name={isDriver ? 'arrow-back' : 'menu'} size={20} color={c.text.primary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: c.text.primary, fontFamily: f.poppinsSemi }]}>Configurações</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* APARÊNCIA */}
        <Text style={[s.sectionTitle, { color: c.text.muted, fontFamily: f.poppinsMedium }]}>APARÊNCIA</Text>
        <View style={s.section}>
          <TouchableOpacity
            style={[s.themeRow, { backgroundColor: c.card }]}
            activeOpacity={0.8}
            onPress={toggleTheme}
          >
            <View style={s.themeOptions}>
              <View style={[s.themeCard, {
                backgroundColor: mode === 'dark' ? '#0b0f13' : '#E5E7EB',
                borderColor: mode === 'dark' ? c.primary : c.border,
                borderWidth: mode === 'dark' ? 2 : 1,
              }]}>
                <Ionicons name="moon" size={22} color={mode === 'dark' ? '#fff' : '#6B7280'} />
                <Text style={[s.themeLabel, {
                  color: mode === 'dark' ? '#fff' : '#6B7280',
                  fontFamily: f.poppinsMedium,
                }]}>Escuro</Text>
                {mode === 'dark' && <View style={[s.themeCheck, { backgroundColor: c.primary }]}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
              </View>
              <View style={[s.themeCard, {
                backgroundColor: mode === 'light' ? '#FFFFFF' : '#1a222d',
                borderColor: mode === 'light' ? c.primary : c.border,
                borderWidth: mode === 'light' ? 2 : 1,
              }]}>
                <Ionicons name="sunny" size={22} color={mode === 'light' ? '#F59E0B' : '#6B7280'} />
                <Text style={[s.themeLabel, {
                  color: mode === 'light' ? '#111827' : '#6B7280',
                  fontFamily: f.poppinsMedium,
                }]}>Claro</Text>
                {mode === 'light' && <View style={[s.themeCheck, { backgroundColor: c.primary }]}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* NOTIFICAÇÕES */}
        <Text style={[s.sectionTitle, { color: c.text.muted, fontFamily: f.poppinsMedium }]}>NOTIFICAÇÕES</Text>
        <View style={s.section}>
          {renderToggle('notifications-outline', c.primary, 'Notificações Push', notifEnabled, handleToggleNotif)}
          <View style={[s.divider, { backgroundColor: c.divider }]} />
          {renderToggle('volume-high-outline', '#34C759', 'Som', soundEnabled, handleToggleSound)}
        </View>

        {/* CONTA */}
        <Text style={[s.sectionTitle, { color: c.text.muted, fontFamily: f.poppinsMedium }]}>CONTA</Text>
        <View style={s.section}>
          {renderNav('person-outline', '#8B5CF6', 'Editar Perfil', 'Nome, foto, telefone',
            () => isDriver ? navigateTo('DeliverProfile') : navigateTo('Profile'))}
          <View style={[s.divider, { backgroundColor: c.divider }]} />
          {renderNav('lock-closed-outline', '#F59E0B', 'Alterar Palavra-passe', '••••••••',
            () => isDriver ? navigateTo('DeliverProfile') : navigateTo('Profile'))}
          <View style={[s.divider, { backgroundColor: c.divider }]} />
          {renderNav('shield-checkmark-outline', c.primary, 'Privacidade e Segurança', '',
            () => navigateTo('Security'))}
          <View style={[s.divider, { backgroundColor: c.divider }]} />
          {renderNav('globe-outline', '#10B981', 'Idioma', lang)}
        </View>

        {/* SOBRE */}
        <Text style={[s.sectionTitle, { color: c.text.muted, fontFamily: f.poppinsMedium }]}>SOBRE</Text>
        <View style={s.section}>
          {renderNav('information-circle-outline', '#6B7280', 'Versão', '1.0.0')}
          <View style={[s.divider, { backgroundColor: c.divider }]} />
          {renderNav('document-text-outline', '#6B7280', 'Termos de Serviço', '')}
          <View style={[s.divider, { backgroundColor: c.divider }]} />
          {renderNav('shield-outline', '#6B7280', 'Política de Privacidade', '')}
        </View>

        {/* SAIR */}
        <TouchableOpacity
          style={[s.logoutBtn, { backgroundColor: c.card, borderColor: c.danger + '30' }]}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={c.danger} />
          <Text style={[s.logoutText, { color: c.danger, fontFamily: f.poppinsMedium }]}>Terminar Sessão</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight ?? 28) + 10,
    paddingHorizontal: 16, paddingBottom: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17 },
  scroll: { paddingBottom: 20 },
  sectionTitle: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2,
    marginTop: 20, marginBottom: 10, marginLeft: 20,
  },
  section: {
    marginHorizontal: 16, borderRadius: 14, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  iconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 14 },
  rowValue: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginLeft: 60 },
  themeRow: { borderRadius: 14, padding: 14 },
  themeOptions: { flexDirection: 'row', gap: 12 },
  themeCard: {
    flex: 1, borderRadius: 12, padding: 16,
    alignItems: 'center', gap: 8, position: 'relative',
  },
  themeLabel: { fontSize: 13 },
  themeCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginTop: 24,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  logoutText: { fontSize: 15 },
});
