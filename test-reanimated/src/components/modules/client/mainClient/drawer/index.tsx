import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../../../firebaseConfig';
import { authService } from '../../../services/api/authService';
import api from '../../../services/api/api';

const menuItems = [
  { label: 'Entregas', icon: 'flame', lib: 'Ionicons', route: 'Home' },
  { label: 'Perfil', icon: 'person-outline', lib: 'Ionicons', route: 'Profile' },
  { label: 'Histórico de entregas', icon: 'time-outline', lib: 'Ionicons', route: 'History' },
  { label: 'Notificações', icon: 'notifications-outline', lib: 'Ionicons', route: 'Notifications' },
  { label: 'Segurança', icon: 'shield-checkmark-outline', lib: 'Ionicons', route: 'Security' },
  { label: 'Ajuda', icon: 'help-circle-outline', lib: 'Ionicons', route: 'Help' },
  { label: 'Configurações', icon: 'settings-outline', lib: 'Ionicons', route: 'Settings' },
];

export default function DrawerContent(props: any) {
  const { navigation, state } = props;
  const currentRoute = state?.routes[state.index]?.name;

  const [userName, setUserName] = useState('Utilizador');
  const [userInitials, setUserInitials] = useState('U');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    const carregarPerfil = async () => {
      try {
        const res = await api.get('/users/perfil');
        const u = res.data;
        const nome = u.nome || '';
        const sobrenome = u.sobrenome || '';
        const fullName = `${nome} ${sobrenome}`.trim() || 'Utilizador';
        setUserName(fullName);
        setUserInitials(
          (nome.charAt(0) || '') + (sobrenome.charAt(0) || '')
        );
        if (u.fotoPerfilUrl) setFotoPerfil(u.fotoPerfilUrl);

        // Rating médio
        try {
          const avalRes = await api.get(`/avaliacoes/utilizador/${u.id}`);
          const avaliacoes = avalRes.data || [];
          if (avaliacoes.length > 0) {
            const media = avaliacoes.reduce((sum: number, a: any) => sum + (a.nota || 0), 0) / avaliacoes.length;
            setUserRating(Math.round(media * 10) / 10);
          }
        } catch {}
      } catch {}
    };
    carregarPerfil();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.limparSessao();
      await signOut(auth);
    } catch {}
    navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.5;
    for (let i = 0; i < full; i++) stars.push(<Ionicons key={i} name="star" size={14} color="#FFD700" />);
    if (hasHalf) stars.push(<Ionicons key="half" name="star-half" size={14} color="#FFD700" />);
    const remaining = 5 - full - (hasHalf ? 1 : 0);
    for (let i = 0; i < remaining; i++) stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#FFD700" />);
    return stars;
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          {fotoPerfil ? (
            <Image source={{ uri: fotoPerfil }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{userInitials.toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={2}>{userName}</Text>
          {userRating > 0 && (
            <View style={styles.ratingRow}>
              {renderStars(userRating)}
              <Text style={styles.ratingText}> {userRating}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {/* MENU ITEMS */}
      <DrawerContentScrollView {...props} style={styles.scroll}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.menuItem,
              currentRoute === item.route && styles.menuItemActive,
            ]}
            onPress={() => navigation.navigate(item.route)}
          >
            <Ionicons
              name={item.icon as any}
              size={22}
              color={currentRoute === item.route ? '#0077FF' : '#A1A1A1'}
              style={styles.menuIcon}
            />
            <Text
              style={[
                styles.menuLabel,
                currentRoute === item.route && styles.menuLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </DrawerContentScrollView>

      {/* FOOTER — LOGOUT */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#CB1D00" style={styles.menuIcon} />
        <Text style={styles.logoutText}>Terminar sessão</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3461FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
  },
  nameContainer: {
    flex: 1,
    flexShrink: 1,
  },
  name: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    color: '#A1A1A1',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E2530',
    marginHorizontal: 20,
  },
  scroll: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 10,
    marginVertical: 2,
  },
  menuItemActive: {
    backgroundColor: '#131D2C',
  },
  menuIcon: {
    marginRight: 14,
  },
  menuLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#A1A1A1',
  },
  menuLabelActive: {
    color: '#0077FF',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1E2530',
  },
  logoutText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#CB1D00',
  },
});
