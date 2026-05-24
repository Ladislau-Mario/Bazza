// src/pages/deliver/mainDeliver/profile/EditProfileSheet.tsx
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themes } from '../../../../global/themes';
import { PickerService } from '../../../../components/modules/services/pickerService/pickerService';
import api from '../../../../components/modules/services/api/api';

// ── Tipos ──────────────────────────────────────────────────────────────────
interface ProfileData {
  name: string;
  email: string;
  phone: string;
  photoUri?: string;
}

interface Props {
  profile: ProfileData;
  onSave: (data: ProfileData) => void;
  onCancel: () => void;
}

// ── Componente ─────────────────────────────────────────────────────────────
export default function EditProfileSheet({ profile, onSave, onCancel }: Props) {
  const [name,     setName]     = useState(profile.name);
  const [email,    setEmail]    = useState(profile.email);
  const [phone,    setPhone]    = useState(profile.phone);
  const [photoUri, setPhotoUri] = useState(profile.photoUri);
  const [saving,   setSaving]   = useState(false);

  const handlePickPhoto = async () => {
    const uri = await PickerService.pickProfileImage();
    if (uri) setPhotoUri(uri);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Campo obrigatório', 'O nome não pode estar vazio.');
      return;
    }
    setSaving(true);
    try {
      // Dividir nome em nome + sobrenome
      const parts = name.trim().split(' ');
      const nome = parts[0];
      const sobrenome = parts.slice(1).join(' ');

      await api.patch('/users/perfil', { nome, sobrenome, email, telefone: phone });

      // Upload da foto se foi alterada
      if (photoUri && photoUri !== profile.photoUri) {
        const formData = new FormData();
        const filename = photoUri.split('/').pop() || 'photo.jpg';
        const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        formData.append('file', { uri: photoUri, name: filename, type: mime } as any);
        await api.post('/users/foto-perfil', formData);
      }

      setSaving(false);
      onSave({ name, email, phone, photoUri });
    } catch (err: any) {
      setSaving(false);
      Alert.alert('Erro', err?.response?.data?.message || 'Não foi possível guardar as alterações.');
    }
  };

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.title}>Editar Perfil</Text>

      {/* Avatar picker */}
      <TouchableOpacity style={s.avatarWrap} onPress={handlePickPhoto} activeOpacity={0.8}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={s.avatarImg} />
        ) : (
          <View style={s.avatarPlaceholder}>
            <Text style={s.avatarInitials}>
              {name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </Text>
          </View>
        )}
        <View style={s.cameraOverlay}>
          <Ionicons name="camera" size={18} color="#fff" />
        </View>
      </TouchableOpacity>
      <Text style={s.avatarHint}>Toca para alterar a foto</Text>

      {/* Inputs */}
      <View style={s.fields}>
        <Field
          label="Nome completo"
          icon="person-outline"
          value={name}
          onChangeText={setName}
          placeholder="O teu nome"
        />
        <Field
          label="Email"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          placeholder="email@exemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Telefone"
          icon="call-outline"
          value={phone}
          onChangeText={setPhone}
          placeholder="+244 9XX XXX XXX"
          keyboardType="phone-pad"
        />
      </View>

      {/* Botões */}
      <TouchableOpacity
        style={[s.saveBtn, saving && s.saveBtnDisabled]}
        onPress={handleSave}
        activeOpacity={0.85}
        disabled={saving}
      >
        {saving ? (
          <Text style={s.saveBtnText}>A guardar…</Text>
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={s.saveBtnText}>Guardar Alterações</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
        <Text style={s.cancelText}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Campo reutilizável ─────────────────────────────────────────────────────
function Field({
  label, icon, value, onChangeText, placeholder, keyboardType, autoCapitalize,
}: {
  label: string;
  icon: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <View style={f.row}>
        <Ionicons name={icon as any} size={17} color="#566070" style={f.icon} />
        <TextInput
          style={f.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#566070"
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'words'}
          selectionColor="#3B7BFF"
        />
      </View>
    </View>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0F1923' },
  scroll: { padding: 24, paddingBottom: 40, alignItems: 'center' },

  title: {
    fontSize: 20,
    color: '#fff',
    fontFamily: themes.fonts.poppinsBold,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },

  avatarWrap: {
    width: 90, height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: '#1A2535',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    color: '#fff',
    fontFamily: themes.fonts.poppinsBold,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    fontSize: 12,
    color: '#566070',
    fontFamily: themes.fonts.poppinsRegular,
    marginBottom: 24,
  },

  fields: { width: '100%', gap: 14, marginBottom: 24 },

  saveBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B7BFF',
    borderRadius: 18,
    paddingVertical: 16,
    shadowColor: '#3B7BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: themes.fonts.poppinsSemi,
  },
  cancelBtn: { marginTop: 12, paddingVertical: 8 },
  cancelText: {
    color: '#566070',
    fontSize: 13,
    fontFamily: themes.fonts.poppinsRegular,
  },
});

const f = StyleSheet.create({
  wrap:  { width: '100%', gap: 6 },
  label: {
    fontSize: 12,
    color: '#566070',
    fontFamily: themes.fonts.poppinsMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141E2B',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#FFFFFF0D',
  },
  icon:  { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#fff',
    fontFamily: themes.fonts.poppinsRegular,
  },
});