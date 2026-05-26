// src/pages/client/mainClient/profile.tsx
import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { themes } from '../../../../global/themes';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../../firebaseConfig';
import api from '../../../../components/modules/services/api/api';
import { enviarFicheiro } from '../../../../components/modules/services/api/uploadService';
import { authService } from '../../../../components/modules/services/api/authService';

type EditField = 'nome' | 'telefone' | 'email' | null;

export default function Profile() {
  const navigation = useNavigation<any>();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['75%'], []);

  const [activeField, setActiveField] = useState<EditField>(null);
  const [editValue, setEditValue] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null); // foto local ou URL Google

  const [userData, setUserData] = useState({
    nome: '', sobrenome: '', telefone: '', email: '',
    fotoPerfilUrl: '', // URL do Google
    totalPedidos: 0, pedidosConcluidos: 0, pedidosCancelados: 0,
  });

  useEffect(() => {
    const carregar = async () => {
      try {
        const [perfilRes, pedidosRes] = await Promise.allSettled([
          api.get('/users/perfil'),
          api.get('/pedidos/meus'),
        ]);

        const u = perfilRes.status === 'fulfilled' ? perfilRes.value.data : {};
        const pedidos = pedidosRes.status === 'fulfilled' ? (pedidosRes.value.data || []) : [];

        setUserData({
          nome: u.nome || '',
          sobrenome: u.sobrenome || '',
          telefone: u.telefone ? `+244 ${u.telefone}` : '',
          email: u.email || '',
          fotoPerfilUrl: u.fotoPerfilUrl || '',
          totalPedidos: pedidos.length,
          pedidosConcluidos: pedidos.filter((p: any) => p.status === 'entregue').length,
          pedidosCancelados: pedidos.filter((p: any) => p.status === 'cancelado').length,
        });

        // Foto do Google
        if (u.fotoPerfilUrl) setFotoUri(u.fotoPerfilUrl);

      } catch (e) {
        const sessao = await authService.obterSessao();
        if (sessao) {
          setUserData(prev => ({
            ...prev,
            nome: sessao.nome || '',
            sobrenome: sessao.sobrenome || '',
            telefone: sessao.telefone || '',
            email: sessao.email || '',
          }));
        }
      }
    };
    carregar();
  }, []);

  const handlePickFoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Baza', 'Precisamos de acesso à galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setFotoUri(uri);
      // Enviar ao backend
      try {
        await enviarFicheiro('foto-perfil', uri, 'image/jpeg');
      } catch (e) {
        console.warn('Foto não guardada no servidor, mas actualizada localmente');
      }
    }
  };

  const openEdit = (field: EditField, currentValue: string) => {
    setActiveField(field);
    setEditValue(currentValue);
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleSave = async () => {
    if (!activeField) { bottomSheetRef.current?.close(); return; }
    setSavingEdit(true);
    try {
      const payload: any = {};
      if (activeField === 'nome') {
        const p = editValue.trim().split(' ');
        payload.nome = p[0]; payload.sobrenome = p.slice(1).join(' ');
      } else if (activeField === 'email') {
        payload.email = editValue;
      } else if (activeField === 'telefone') {
        payload.telefone = editValue.replace('+244', '').trim();
      }
      await api.patch('/users/perfil', payload);
      setUserData(prev => ({
        ...prev,
        ...(activeField === 'nome' && { nome: payload.nome, sobrenome: payload.sobrenome || prev.sobrenome }),
        ...(activeField === 'email' && { email: payload.email }),
        ...(activeField === 'telefone' && { telefone: editValue }),
      }));
      bottomSheetRef.current?.close();
      setActiveField(null);
    } catch (e: any) {
      Alert.alert('Baza', e.response?.data?.message || 'Erro ao guardar.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Terminar Sessão', 'Tens a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive',
        onPress: async () => {
          try { await signOut(auth); } catch (_) {}
          await authService.limparSessao();
          navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
        },
      },
    ]);
  };

  const nomeCompleto = [userData.nome, userData.sobrenome].filter(Boolean).join(' ');
  const initials = nomeCompleto.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const fieldLabel = { nome: 'Nome', telefone: 'Telefone', email: 'Email' };

  const OptionRow = ({ icon, label, value, onPress, danger, last }: any) => (
    <>
      <TouchableOpacity style={s.optionRow} onPress={onPress} activeOpacity={0.6}>
        <View style={[s.optionIconWrap, danger && { backgroundColor: '#EF444415' }]}>
          <Ionicons name={icon} size={17} color={danger ? '#EF4444' : '#6B7280'} />
        </View>
        <View style={s.optionInfo}>
          <Text style={[s.optionLabel, danger && { color: '#EF4444' }]}>{label}</Text>
          {value ? <Text style={s.optionValue} numberOfLines={1}>{value}</Text> : null}
        </View>
        {!danger && <Ionicons name="chevron-forward" size={14} color="#374151" />}
      </TouchableOpacity>
      {!last && <View style={s.divider} />}
    </>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={s.container}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={s.avatarSection}>
            <TouchableOpacity onPress={handlePickFoto} activeOpacity={0.8}>
              {fotoUri ? (
                <View style={s.avatarWrapper}>
                  <Image source={{ uri: fotoUri }} style={s.avatarImg} />
                  <View style={s.cameraBtn}>
                    <Ionicons name="camera" size={13} color="#fff" />
                  </View>
                </View>
              ) : (
                <View style={s.avatarWrapper}>
                  <LinearGradient colors={['#2D60FF', '#1a3fa0']} style={s.avatarGradient}>
                    <Text style={s.avatarInitials}>{initials || '?'}</Text>
                  </LinearGradient>
                  <View style={s.cameraBtn}>
                    <Ionicons name="camera" size={13} color="#fff" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
            <Text style={s.userName}>{nomeCompleto || 'Utilizador Baza'}</Text>
            <Text style={s.userPhone}>{userData.telefone || userData.email || ''}</Text>
            <View style={s.statsRow}>
              {[
                { label: 'Pedidos', value: userData.totalPedidos, color: '#2D60FF', bg: '#2D60FF15' },
                { label: 'Concluídos', value: userData.pedidosConcluidos, color: '#10B981', bg: '#10B98115' },
                { label: 'Cancelados', value: userData.pedidosCancelados, color: '#EF4444', bg: '#EF444415' },
              ].map((st, i) => (
                <View key={i} style={[s.statPill, { backgroundColor: st.bg }]}>
                  <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
                  <Text style={[s.statLabel, { color: st.color + 'AA' }]}>{st.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Informações</Text>
            <View style={s.card}>
              <OptionRow icon="person-outline" label="Nome" value={nomeCompleto} onPress={() => openEdit('nome', nomeCompleto)} />
              <OptionRow icon="call-outline" label="Telefone" value={userData.telefone} onPress={() => openEdit('telefone', userData.telefone)} />
              <OptionRow icon="mail-outline" label="Email" value={userData.email} onPress={() => openEdit('email', userData.email)} last />
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Conta</Text>
            <View style={s.card}>
              <OptionRow icon="time-outline" label="Histórico" onPress={() => navigation.navigate('History')} />
              <OptionRow icon="help-circle-outline" label="Ajuda" onPress={() => navigation.navigate('Help')} last />
            </View>
          </View>

          <View style={[s.section, { marginBottom: 40 }]}>
            <View style={s.card}>
              <OptionRow icon="log-out-outline" label="Terminar Sessão" danger last onPress={handleLogout} />
            </View>
          </View>
        </ScrollView>

        <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose
          backgroundStyle={s.sheetBg} handleIndicatorStyle={s.sheetIndicator}
          keyboardBehavior="interactive" keyboardBlurBehavior="restore" android_keyboardInputMode="adjustResize">
          <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={s.sheetContent} keyboardShouldPersistTaps="handled">
            {activeField && (
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <Text style={s.sheetTitle}>Editar {fieldLabel[activeField]}</Text>
                <Text style={s.sheetSubtitle}>Actualiza o teu {fieldLabel[activeField].toLowerCase()} abaixo.</Text>
                <View style={s.inputWrap}>
                  <Text style={s.inputLabel}>{fieldLabel[activeField]}</Text>
                  <TextInput
                    style={s.input} value={editValue} onChangeText={setEditValue}
                    placeholder={`Insere o teu ${fieldLabel[activeField].toLowerCase()}`}
                    placeholderTextColor="#4B5563"
                    keyboardType={activeField === 'telefone' ? 'phone-pad' : activeField === 'email' ? 'email-address' : 'default'}
                    autoFocus selectionColor="#2D60FF"
                  />
                </View>
                <View style={s.sheetActions}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => { bottomSheetRef.current?.close(); setActiveField(null); }}>
                    <Text style={s.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={savingEdit}>
                    <Text style={s.saveBtnText}>{savingEdit ? 'A guardar...' : 'Guardar'}</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1923' },
  scroll: { paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingTop: 56, paddingBottom: 12 },
  avatarSection: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 20 },
  avatarWrapper: { width: 88, height: 88, borderRadius: 44, marginBottom: 14, position: 'relative' },
  avatarImg: { width: 88, height: 88, borderRadius: 44 },
  avatarGradient: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 30, fontFamily: themes.fonts.poppinsBold, color: '#fff' },
  cameraBtn: { position: 'absolute', bottom: 0, right: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: '#2D60FF', borderWidth: 2, borderColor: '#0F1923', alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 20, fontFamily: themes.fonts.poppinsBold, color: '#fff', marginBottom: 2 },
  userPhone: { fontSize: 13, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280', marginBottom: 18 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statPill: { borderRadius: 14, paddingVertical: 10, paddingHorizontal: 18, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontFamily: themes.fonts.poppinsBold },
  statLabel: { fontSize: 10, fontFamily: themes.fonts.poppinsRegular },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 11, fontFamily: themes.fonts.poppinsMedium, color: '#4B5563', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 2 },
  card: { backgroundColor: '#1A2535', borderRadius: 18, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: '#1F2D3D', marginLeft: 52 },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, gap: 12 },
  optionIconWrap: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#1F2D3D', alignItems: 'center', justifyContent: 'center' },
  optionInfo: { flex: 1 },
  optionLabel: { fontSize: 14, fontFamily: themes.fonts.poppinsMedium, color: '#E5E7EB' },
  optionValue: { fontSize: 11, fontFamily: themes.fonts.poppinsRegular, color: '#4B5563', marginTop: 1 },
  sheetBg: { backgroundColor: '#1A2535', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetIndicator: { backgroundColor: '#2D3748', width: 36 },
  sheetContent: { flex: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 },
  sheetTitle: { fontSize: 20, fontFamily: themes.fonts.poppinsBold, color: '#fff', marginBottom: 4 },
  sheetSubtitle: { fontSize: 13, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280', marginBottom: 20 },
  inputWrap: { gap: 6 },
  inputLabel: { fontSize: 12, fontFamily: themes.fonts.poppinsMedium, color: '#6B7280', marginLeft: 2 },
  input: { backgroundColor: '#0F1923', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16, fontSize: 15, fontFamily: themes.fonts.poppinsRegular, color: '#fff', borderWidth: 1, borderColor: '#1F2D3D' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  saveBtn: { flex: 1, backgroundColor: '#2D60FF', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },
  cancelBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#1F2D3D' },
  cancelBtnText: { fontSize: 14, fontFamily: themes.fonts.poppinsMedium, color: '#6B7280' },
});