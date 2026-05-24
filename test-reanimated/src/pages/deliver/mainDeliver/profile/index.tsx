// src/pages/deliver/mainDeliver/profile/index.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Image, Alert, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { themes } from '../../../../global/themes';
import api from '../../../../components/modules/services/api/api';
import { authService } from '../../../../components/modules/services/api/authService';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../../firebaseConfig';

// BottomSheet do Reactix
import BottomSheet from '../../../../components/templates/index';
import { BottomSheetMethods } from '../../../../components/templates/types';

// Sheet de edição
import EditProfileSheet from './editProfileSheet';

// ── Tipos ──────────────────────────────────────────────────────────────────
interface ProfileData {
  name: string;
  email: string;
  phone: string;
  photoUri?: string;
  plan: string;
  planActive: boolean;
}

// ── Mock user (substituir por contexto/auth real) ──────────────────────────
const MOCK_USER: ProfileData = {
  name: 'Adam James',
  email: 'sabesaki@bigmail.com',
  phone: '+244 923 456 789',
  plan: 'Pro',
  planActive: true,
};

// ── Menu items ─────────────────────────────────────────────────────────────
function buildMenuItems(navigation: any) {
  return [
    {
      icon: 'notifications-outline',
      label: 'Notificações',
      iconColor: '#3B7BFF',
      bgColor: '#3B7BFF18',
      borderColor: '#3B7BFF20',
      onPress: () => navigation.navigate('DeliverNotifications'),
    },
    {
      icon: 'document-text-outline',
      label: 'Documentos',
      iconColor: '#F59E0B',
      bgColor: '#F59E0B18',
      borderColor: '#F59E0B20',
      onPress: () => navigation.navigate('DeliverDocuments'),
    },
    {
      icon: 'time-outline',
      label: 'Histórico',
      iconColor: '#22D07A',
      bgColor: '#22D07A18',
      borderColor: '#22D07A20',
      onPress: () => navigation.navigate('DeliverHistory'),
    },
    {
      icon: 'flash-outline',
      label: 'Planos',
      iconColor: '#00D4FF',
      bgColor: '#00D4FF18',
      borderColor: '#00D4FF20',
      onPress: () => navigation.navigate('Plans'),
    },
    {
      icon: 'settings-outline',
      label: 'Configurações',
      iconColor: '#A855F7',
      bgColor: '#A855F718',
      borderColor: '#A855F720',
      onPress: () => navigation.navigate('DeliverSettings'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Suporte & Ajuda',
      iconColor: '#FFB830',
      bgColor: '#FFB83018',
      borderColor: '#FFB83020',
      onPress: () => navigation.navigate('DeliverSupport'),
    },
  ];
}

// ── Página principal ───────────────────────────────────────────────────────
export default function DeliverProfile() {
  const navigation = useNavigation<any>();
  const sheetRef   = useRef<BottomSheetMethods>(null);

  const [profile, setProfile] = useState<ProfileData>({ name: '', email: '', phone: '', plan: '', planActive: false });
  const menuItems = buildMenuItems(navigation);

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await api.get('/users/perfil');
        const u = res.data;
        const nome = u.nome || '';
        const sobrenome = u.sobrenome || '';

        // Determinar nome do plano
        let planName = 'Free';
        let planActive = false;
        if (u.planoAtivo) {
          planName = u.planoAtivo.charAt(0).toUpperCase() + u.planoAtivo.slice(1);
          if (u.planoExpiraEm) {
            planActive = new Date(u.planoExpiraEm) > new Date();
          }
        }

        setProfile({
          name: `${nome} ${sobrenome}`.trim() || 'Motoqueiro',
          email: u.email || '',
          phone: u.telefone || '',
          photoUri: u.fotoPerfilUrl || undefined,
          plan: planName,
          planActive,
        });
      } catch {}
    };
    carregar();
  }, []);

  const initials = profile.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSaveProfile = (data: Omit<ProfileData, 'plan' | 'planActive'>) => {
    setProfile(prev => ({ ...prev, ...data }));
    sheetRef.current?.close();
  };

  const handleLogout = () => {
    Alert.alert(
      'Terminar Sessão',
      'Tens a certeza que queres sair da tua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.limparSessao();
              await signOut(auth);
            } catch {}
            navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
          },
        },
      ],
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── Header gradient ── */}
        <View style={s.header}>
          <LinearGradient
            colors={['#1A2A4A', '#0F1923']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Avatar + info */}
          <View style={s.profileRow}>
            <TouchableOpacity
              style={s.avatarWrap}
              onPress={() => sheetRef.current?.snapToIndex(0)}
              activeOpacity={0.85}
            >
              {profile.photoUri ? (
                <Image source={{ uri: profile.photoUri }} style={s.avatarImg} />
              ) : (
                <LinearGradient
                  colors={['#3B7BFF', '#1A4FCC']}
                  style={s.avatarGradient}
                >
                  <Text style={s.avatarInitials}>{initials}</Text>
                </LinearGradient>
              )}
              <View style={s.cameraBtn}>
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={s.profileInfo}>
              <Text style={s.profileName}>{profile.name}</Text>
              <View style={s.profileDetailRow}>
                <Ionicons name="mail-outline" size={13} color="#8899AA" />
                <Text style={s.profileDetail}>{profile.email}</Text>
              </View>
              <View style={s.profileDetailRow}>
                <Ionicons name="call-outline" size={13} color="#8899AA" />
                <Text style={s.profileDetail}>{profile.phone}</Text>
              </View>

              {/* Plan badge */}
              {profile.planActive && (
                <View style={s.planBadge}>
                  <Ionicons name="flash" size={10} color="#00D4FF" />
                  <Text style={s.planBadgeText}>Plano {profile.plan} activo</Text>
                </View>
              )}
            </View>
          </View>

          {/* Editar perfil */}
          <TouchableOpacity
            style={s.editRow}
            onPress={() => sheetRef.current?.snapToIndex(0)}
            activeOpacity={0.75}
          >
            <Text style={s.editRowText}>Editar Perfil</Text>
            <Ionicons name="arrow-forward" size={15} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        {/* ── Menu items ── */}
        <View style={s.menuSection}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[s.menuCard, { borderColor: item.borderColor }]}
              onPress={item.onPress}
              activeOpacity={0.75}
            >
              <View style={[s.menuIconWrap, { backgroundColor: item.bgColor }]}>
                <Ionicons name={item.icon as any} size={22} color={item.iconColor} />
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#2D3748" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={s.logoutCard} onPress={handleLogout} activeOpacity={0.75}>
          <View style={s.logoutIconWrap}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          </View>
          <Text style={s.logoutLabel}>Terminar Sessão</Text>
          <Ionicons name="chevron-forward" size={18} color="#2D3748" />
        </TouchableOpacity>

        <Text style={s.version}>Versão 1.0.0</Text>
      </ScrollView>

      {/* ── Bottom Sheet — Editar Perfil ── */}
      <BottomSheet
        ref={sheetRef}
        snapPoints={['75%', '95%']}
        backgroundColor="#0F1923"
        backdropOpacity={0.7}
        borderRadius={28}
        handleStyle={{ backgroundColor: '#FFFFFF25' }}
      >
        <EditProfileSheet
          profile={profile}
          onSave={handleSaveProfile}
          onCancel={() => sheetRef.current?.close()}
        />
      </BottomSheet>
    </View>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#080C10' },
  scroll: { paddingBottom: 120 },

  // Header
  header: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ?? 28) + 16,
    paddingBottom: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF08',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    marginBottom: 18,
    gap: 16,
  },
  avatarWrap: {
    width: 76, height: 76,
    borderRadius: 38,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#3B7BFF40',
    flexShrink: 0,
  },
  avatarImg:      { width: '100%', height: '100%' },
  avatarGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 28, color: '#fff', fontFamily: themes.fonts.poppinsBold },
  cameraBtn: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileInfo:      { flex: 1, gap: 5 },
  profileName:      { fontSize: 18, color: '#fff', fontFamily: themes.fonts.poppinsSemi },
  profileDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileDetail:    { fontSize: 12, color: '#8899AA', fontFamily: themes.fonts.poppinsRegular },

  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#00D4FF18',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#00D4FF25',
    marginTop: 4,
  },
  planBadgeText: { fontSize: 10, color: '#00D4FF', fontFamily: themes.fonts.poppinsSemi },

  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 22,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF10',
  },
  editRowText: { fontSize: 14, color: 'rgba(255,255,255,0.65)', fontFamily: themes.fonts.poppinsMedium },

  // Menu
  menuSection: { paddingHorizontal: 16, gap: 10 },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1923',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  menuIconWrap: {
    width: 46, height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, color: '#E2E8F0', fontFamily: themes.fonts.poppinsMedium },

  // Logout
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1923',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EF444420',
    gap: 14,
  },
  logoutIconWrap: {
    width: 46, height: 46,
    borderRadius: 14,
    backgroundColor: '#EF444418',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutLabel: { flex: 1, fontSize: 15, color: '#EF4444', fontFamily: themes.fonts.poppinsMedium },

  version: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 11,
    color: '#2D3748',
    fontFamily: themes.fonts.poppinsRegular,
  },
});