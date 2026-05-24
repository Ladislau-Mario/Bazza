import React, { useState, useEffect } from 'react';
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, 
  FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themes } from '../../../global/themes';

interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: string) => void;
  title: string;
  data: string[]; // Recebe a lista de strings (Marcas, Modelos ou Cores)
}

export function SelectionModal({ visible, onClose, onSelect, title, data }: SelectionModalProps) {
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState<string[]>(data);

  // Atualiza a lista filtrada sempre que o texto de busca ou os dados mudarem
  useEffect(() => {
    const filtered = data.filter(item => 
      item.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchText, data]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <Pressable style={styles.content}>
            {/* Linha superior (Handle e Fechar) */}
            <View style={styles.header}>
              <View style={styles.handle} />
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>{title}</Text>

            {/* Campo de Busca Interno */}
            <View style={styles.searchArea}>
              <Ionicons name="search" size={18} color="#A1A1A1" />
              <TextInput
                style={styles.searchInput}
                placeholder="Pesquisar..."
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            {/* Lista de Itens */}
            <FlatList
              data={filteredData}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.item} 
                  onPress={() => {
                    onSelect(item);
                    setSearchText(''); // Limpa a busca para a próxima vez
                    onClose();
                  }}
                >
                  <Text style={styles.itemText}>{item}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#E0E0E0" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Nenhum resultado encontrado.</Text>
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
    height: '75%', // Ocupa 75% da altura
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 10,
  },
  title: {
    fontFamily: themes.fonts.poppinsRegular,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1E2530'
  },
  searchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 45,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: themes.fonts.poppinsRegular,
    fontSize: 14,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemText: {
    fontFamily: themes.fonts.poppinsRegular,
    fontSize: 15,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
    fontFamily: themes.fonts.poppinsRegular,
  }
});