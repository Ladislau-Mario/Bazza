import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Modal, StatusBar, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTheme } from '../../global/ThemeContext';
import { themes } from '../../global/themes';
import { suporteService, MensagemSuporte, Ticket } from '../modules/services/api/suporteService';

// ─── Tópicos por tipo de utilizador ────────────────────────────────────────
const TOPICS_CLIENT = [
  {
    icon: 'bicycle-outline', label: 'Como faço um pedido de entrega?',
    answer: 'Abra o app BAZA, insira o endereço de recolha e entrega, escolha o tipo de pacote e confirme. Um motoqueiro será atribuído automaticamente para a tua entrega.',
  },
  {
    icon: 'card-outline', label: 'Como funciona o pagamento?',
    answer: 'O pagamento é feito directamente ao motoqueiro em dinheiro ou via transferência. O valor é calculado com base na distância e no tipo de entrega seleccionado.',
  },
  {
    icon: 'close-circle-outline', label: 'Como cancelo uma entrega?',
    answer: 'Vá ao histórico de entregas, selecione a entrega activa e toque em "Cancelar". Se o motoqueiro já estiver a caminho, pode haver uma taxa de cancelamento.',
  },
  {
    icon: 'star-outline', label: 'Como avalio o motoqueiro?',
    answer: 'Após a conclusão da entrega, aparecerá automaticamente um popup de avaliação. Podes atribuir de 1 a 5 estrelas e deixar um comentário sobre o serviço.',
  },
  {
    icon: 'cube-outline', label: 'Esqueci um objecto na moto',
    answer: 'Contacta imediatamente o suporte através do chat ou liga para a central. Tenta informar o número da entrega e a descrição do objecto esquecido.',
  },
  {
    icon: 'receipt-outline', label: 'Problema com cobrança',
    answer: 'Se foste cobrado de forma incorrecta, abre o chat com o suporte e envia o comprovativo da entrega. A nossa equipa irá analisar e fazer o reembolso se aplicável.',
  },
];

const TOPICS_DRIVER = [
  {
    icon: 'card-outline', label: 'Pagamento do plano',
    answer: 'O pagamento do plano é feito mensalmente através do app. Aceda a "Planos" no teu perfil para ver as opções disponíveis e efectuar o pagamento.',
  },
  {
    icon: 'person-outline', label: 'Problemas com conta',
    answer: 'Se a tua conta foi suspensa ou tens dificuldades em aceder, contacta o suporte pelo chat. Informa o teu número de telefone registado para agilizar o processo.',
  },
  {
    icon: 'map-outline', label: 'Problemas com mapa',
    answer: 'Se o mapa não está a actualizar a tua localização, verifica se o GPS está activado e concede permissão de localização ao app nas definições do teu telemóvel.',
  },
  {
    icon: 'cash-outline', label: 'Pagamentos e ganhos',
    answer: 'Os teus ganhos são acumulados diariamente e podem ser levantados conforme o teu plano. Consulta a secção "Ganhos" para ver o histórico e solicitar levantamentos.',
  },
  {
    icon: 'shield-outline', label: 'Segurança na entrega',
    answer: 'Em caso de emergência durante uma entrega, utiliza o Botão de Pânico nesta página ou liga 111. A nossa central está disponível 24h para te apoiar.',
  },
];

const QUICK_REPLIES_CLIENT = [
  'Esqueci um objecto na moto',
  'Cobrança de valor incorrecto',
  'Problema ao solicitar uma corrida',
  'Reportar conduta perigosa do motorista',
  'Outro assunto',
];

const QUICK_REPLIES_DRIVER = [
  'Problema com o pagamento do plano',
  'Minha conta foi suspensa',
  'Erro no mapa de navegação',
  'Reportar comportamento do cliente',
  'Outro assunto',
];

// ─── Contactos de emergência ───────────────────────────────────────────────
const EMERGENCY_CONTACTS = [
  { icon: 'shield-checkmark-outline', label: 'Polícia Nacional', number: '113' },
  { icon: 'flame-outline', label: 'Bombeiros', number: '115' },
  { icon: 'medkit-outline', label: 'Emergência Médica', number: '112' },
];

// ─── Props ─────────────────────────────────────────────────────────────────
interface Props {
  userType: 'client' | 'driver';
}

export default function SuporteSeguranca({ userType }: Props) {
  const navigation = useNavigation<any>();
  const chatScrollRef = useRef<ScrollView>(null);
  const { theme } = useTheme();

  const isDriver = userType === 'driver';
  const topics = isDriver ? TOPICS_DRIVER : TOPICS_CLIENT;
  const quickReplies = isDriver ? QUICK_REPLIES_DRIVER : QUICK_REPLIES_CLIENT;

  // Dynamic colors from theme
  const bg = theme.colors.background;
  const surface = theme.colors.surface;
  const textPrimary = theme.colors.text.primary;
  const textSecondary = theme.colors.text.secondary;
  const primary = theme.colors.primary;
  const muted = theme.colors.text.muted || '#6B7280';

  // ── Chat state ────────────────────────────────────────────────────────
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: string; text: string; from: 'user' | 'support'; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);

  // Carregar ticket existente quando abre o chat
  useEffect(() => {
    if (chatVisible && !currentTicket) {
      (async () => {
        try {
          const tickets: Ticket[] = await suporteService.meusTickets();
          // Encontrar ticket aberto ou em_analise mais recente
          const openTicket = tickets.find(t => t.status !== 'resolvido');
          if (openTicket) {
            setCurrentTicket(openTicket);
          }
        } catch {}
      })();
    }
  }, [chatVisible]);

  // Carregar mensagens quando abre o chat com ticket existente
  useEffect(() => {
    if (chatVisible && currentTicket) {
      const interval = setInterval(async () => {
        try {
          const msgs: MensagemSuporte[] = await suporteService.listarMensagens(currentTicket.id);
          setChatMessages(msgs.map(m => ({
            id: m.id,
            text: m.texto,
            from: m.remetenteTipo === 'admin' ? 'support' as const : 'user' as const,
            time: new Date(m.criadoEm).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
          })));
        } catch {}
      }, 3000);
      // Carregar imediatamente
      (async () => {
        try {
          const msgs: MensagemSuporte[] = await suporteService.listarMensagens(currentTicket.id);
          setChatMessages(msgs.map(m => ({
            id: m.id,
            text: m.texto,
            from: m.remetenteTipo === 'admin' ? 'support' as const : 'user' as const,
            time: new Date(m.criadoEm).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
          })));
        } catch {}
      })();
      return () => clearInterval(interval);
    }
  }, [chatVisible, currentTicket]);

  const now = () =>
    new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

  // ── Enviar mensagem ───────────────────────────────────────────────────
  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? chatInput).trim();
    if (!msg || sending) return;

    setSending(true);
    setChatInput('');

    try {
      if (!currentTicket) {
        // Criar novo ticket com a primeira mensagem
        const ticket: Ticket = await suporteService.criarTicket({ assunto: msg, mensagem: msg });
        setCurrentTicket(ticket);
        // Recarregar mensagens do ticket
        const msgs: MensagemSuporte[] = await suporteService.listarMensagens(ticket.id);
        setChatMessages(msgs.map(m => ({
          id: m.id,
          text: m.texto,
          from: m.remetenteTipo === 'admin' ? 'support' as const : 'user' as const,
          time: new Date(m.criadoEm).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        })));
      } else {
        // Enviar mensagem no ticket existente
        await suporteService.enviarMensagem(currentTicket.id, msg);
        // Recarregar mensagens
        const msgs: MensagemSuporte[] = await suporteService.listarMensagens(currentTicket.id);
        setChatMessages(msgs.map(m => ({
          id: m.id,
          text: m.texto,
          from: m.remetenteTipo === 'admin' ? 'support' as const : 'user' as const,
          time: new Date(m.criadoEm).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        })));
      }
    } catch {
      // Erro silencioso
    } finally {
      setSending(false);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [chatInput, sending, currentTicket]);

  // ── Botão de pânico ───────────────────────────────────────────────────
  const handleEmergencyCall = () => {
    Linking.openURL('tel:111');
  };

  // ── Ligar para contacto de emergência ─────────────────────────────────
  const handleCallNumber = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  // ── Render: Chat modal ────────────────────────────────────────────────
  function renderChat() {
    return (
      <Modal visible={chatVisible} animationType="slide" transparent={false} statusBarTranslucent
        onRequestClose={() => setChatVisible(false)}>
        <KeyboardAvoidingView
          style={ch.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={ch.header}>
            <TouchableOpacity style={ch.backCircle} onPress={() => setChatVisible(false)}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={ch.headerCenter}>
              <View style={ch.headerAvatar}>
                <Ionicons name="headset" size={18} color="#3B7BFF" />
              </View>
              <View>
                <Text style={ch.headerName}>Suporte BAZA</Text>
                <View style={ch.onlineRow}>
                  <View style={ch.onlineDot} />
                  <Text style={ch.onlineTxt}>Online</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Messages */}
          <ScrollView ref={chatScrollRef} style={ch.messagesArea}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            indicatorStyle="white"
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}>
            {chatMessages.length === 0 && (
              <Text style={ch.emptyText}>
                Selecciona uma das opções abaixo ou escreve a tua mensagem.
              </Text>
            )}
            {chatMessages.map(msg => {
              const isMe = msg.from === 'user';
              return (
                <View key={msg.id} style={[ch.msgRow, isMe && ch.msgRowMe]}>
                  {!isMe && (
                    <View style={ch.msgAvatar}>
                      <Ionicons name="headset" size={14} color="#3B7BFF" />
                    </View>
                  )}
                  <View style={[ch.bubble, isMe ? ch.bubbleMe : ch.bubbleSupport]}>
                    <Text style={ch.bubbleText}>{msg.text}</Text>
                    <Text style={ch.bubbleTime}>{msg.time}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Quick replies + Input */}
          <View style={ch.bottomArea}>
            {chatMessages.length === 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={ch.quickRepliesRow} style={ch.quickRepliesScroll}>
                {quickReplies.map((text, i) => (
                  <TouchableOpacity key={i} style={ch.quickReplyBtn}
                    onPress={() => handleSend(text)} activeOpacity={0.7}>
                    <Text style={ch.quickReplyTxt}>{text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={ch.inputRow}>
              <TextInput style={ch.input} placeholder="Escreve uma mensagem..."
                placeholderTextColor="#6B7280" value={chatInput}
                onChangeText={setChatInput} multiline maxLength={500}
                returnKeyType="send" onSubmitEditing={() => handleSend()} />
              <TouchableOpacity style={[ch.sendBtn, !chatInput.trim() && { backgroundColor: '#3B7BFF50' }]}
                onPress={() => handleSend()} disabled={!chatInput.trim() || sending}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // ── Render principal ──────────────────────────────────────────────────
  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={[s.backBtn, { backgroundColor: surface }]} onPress={() => isDriver ? navigation.goBack() : navigation.dispatch(DrawerActions.openDrawer())}>
            <Ionicons name={isDriver ? 'arrow-back' : 'menu'} size={22} color={textPrimary} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: textPrimary }]}>Suporte & Ajuda</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Cards superiores (Grid) ──────────────────────────────────── */}
        <View style={s.cardsRow}>
          <TouchableOpacity style={[s.card, { backgroundColor: surface }]} activeOpacity={0.8} onPress={() => setChatVisible(true)}>
            <View style={[s.cardIconWrap, { backgroundColor: `${primary}15` }]}>
              <Ionicons name="chatbubbles-outline" size={26} color={primary} />
            </View>
            <Text style={[s.cardLabel, { color: textPrimary }]}>Suporte</Text>
            <Text style={[s.cardSublabel, { color: muted }]}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.card, { backgroundColor: surface }]} activeOpacity={0.8}
            onPress={() => handleCallNumber(EMERGENCY_CONTACTS[0].number)}>
            <View style={[s.cardIconWrap, { backgroundColor: '#FF3B3015' }]}>
              <Ionicons name="location-outline" size={26} color="#FF3B30" />
            </View>
            <Text style={[s.cardLabel, { color: textPrimary }]}>Emergência</Text>
            <Text style={[s.cardSublabel, { color: muted }]}>Contactos</Text>
          </TouchableOpacity>
        </View>

        {/* ── Botão de Pânico ──────────────────────────────────────────── */}
        <TouchableOpacity style={s.panicBtn} activeOpacity={0.85} onPress={handleEmergencyCall}>
          <Ionicons name="warning-outline" size={22} color="#fff" />
          <Text style={s.panicText}>Botão de Pânico (Central)</Text>
        </TouchableOpacity>

        {/* ── Contactos de emergência (lista) ──────────────────────────── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: muted }]}>CONTACTOS DE EMERGÊNCIA</Text>
          <View style={[s.listCard, { backgroundColor: surface }]}>
            {EMERGENCY_CONTACTS.map((contact, i) => (
              <React.Fragment key={i}>
                <TouchableOpacity style={s.listRow} activeOpacity={0.6}
                  onPress={() => handleCallNumber(contact.number)}>
                  <View style={[s.listIconWrap, { backgroundColor: `${surface}cc` }]}>
                    <Ionicons name={contact.icon as any} size={18} color="#FF3B30" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.listLabel, { color: textPrimary }]}>{contact.label}</Text>
                    <Text style={[s.listNumber, { color: muted }]}>{contact.number}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={muted} />
                </TouchableOpacity>
                {i < EMERGENCY_CONTACTS.length - 1 && <View style={[s.divider, { backgroundColor: `${surface}cc` }]} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── Tópicos frequentes ───────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: muted }]}>TÓPICOS FREQUENTES</Text>
          <View style={s.topicsList}>
            {topics.map((topic, i) => {
              const isOpen = expandedTopic === i;
              return (
                <View key={i}>
                  <TouchableOpacity style={[s.topicRow, { backgroundColor: surface }, isOpen && [s.topicRowActive, { borderColor: `${primary}30`, borderBottomColor: surface }]]} activeOpacity={0.7}
                    onPress={() => setExpandedTopic(isOpen ? null : i)}>
                    <View style={[s.topicCheck, isOpen && { backgroundColor: primary, borderColor: primary }]}>
                      {isOpen && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text style={[s.topicLabel, { color: textPrimary }, isOpen && { color: textPrimary }]}>{topic.label}</Text>
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={isOpen ? primary : muted} />
                  </TouchableOpacity>
                  {isOpen && (
                    <View style={[s.topicAnswer, { backgroundColor: surface }]}>
                      <Text style={[s.topicAnswerText, { color: textSecondary }]}>{topic.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Falar com suporte (atalho) ───────────────────────────────── */}
        <TouchableOpacity style={[s.supportRow, { backgroundColor: surface, borderColor: `${primary}25` }]} activeOpacity={0.75} onPress={() => setChatVisible(true)}>
          <View style={[s.supportIconWrap, { backgroundColor: `${primary}15` }]}>
            <Ionicons name="chatbubble-ellipses" size={20} color={primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.supportTitle, { color: textPrimary }]}>Falar com Suporte</Text>
            <Text style={[s.supportDesc, { color: muted }]}>Envia a tua mensagem e nós respondemos.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={muted} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {renderChat()}
    </View>
  );
}

// ─── Estilos da página ────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f13' },
  scroll: { paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight ?? 28) + 10,
    paddingHorizontal: 16, paddingBottom: 14,
  },
  menuBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1a222d', alignItems: 'center', justifyContent: 'center',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1a222d', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },

  // ── Cards superiores (Grid) ──────────────────────────────────────────
  cardsRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 16, marginBottom: 20,
  },
  card: {
    flex: 1, backgroundColor: '#1a222d',
    borderRadius: 16, padding: 18, alignItems: 'center',
    gap: 8,
  },
  cardIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#3B7BFF15', alignItems: 'center', justifyContent: 'center',
  },
  cardLabel: { fontSize: 14, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },
  cardSublabel: { fontSize: 11, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280', marginTop: -4 },

  // ── Botão de Pânico ──────────────────────────────────────────────────
  panicBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#ff3b30',
    marginHorizontal: 16, paddingVertical: 16,
    borderRadius: 14, marginBottom: 24,
  },
  panicText: {
    fontSize: 15, fontFamily: themes.fonts.poppinsBold, color: '#fff',
  },

  // ── Secções e listas ─────────────────────────────────────────────────
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontSize: 11, fontFamily: themes.fonts.poppinsMedium, color: '#4B5563',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, marginLeft: 4,
  },
  listCard: {
    backgroundColor: '#1a222d', borderRadius: 12, overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: '#232d3a', marginLeft: 54 },
  listRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 14, gap: 12,
  },
  listIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#232d3a', alignItems: 'center', justifyContent: 'center',
  },
  listLabel: { flex: 1, fontSize: 14, fontFamily: themes.fonts.poppinsMedium, color: '#E5E7EB' },
  listNumber: { fontSize: 12, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280', marginTop: 2 },

  // ── Tópicos FAQ (accordion) ──────────────────────────────────────────
  topicsList: { gap: 6 },
  topicRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a222d', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 14, gap: 12,
  },
  topicRowActive: {
    backgroundColor: '#1a222d', borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    borderWidth: 1, borderColor: '#3B7BFF30', borderBottomColor: '#232d3a',
  },
  topicCheck: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#232d3a', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#2d3a4a',
  },
  topicCheckActive: {
    backgroundColor: '#3B7BFF', borderColor: '#3B7BFF',
  },
  topicLabel: { flex: 1, fontSize: 14, fontFamily: themes.fonts.poppinsMedium, color: '#E5E7EB' },
  topicLabelActive: { color: '#fff' },
  topicAnswer: {
    backgroundColor: '#1a222d', borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    paddingHorizontal: 14, paddingBottom: 16, paddingTop: 6,
    marginTop: -2,
  },
  topicAnswerText: {
    fontSize: 13, fontFamily: themes.fonts.poppinsRegular, color: '#9CA3AF',
    lineHeight: 20, marginLeft: 40,
  },

  // ── Atalho suporte ───────────────────────────────────────────────────
  supportRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#1a222d', borderRadius: 14,
    marginHorizontal: 16, padding: 16,
    borderWidth: 1, borderColor: '#3B7BFF25',
  },
  supportIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#3B7BFF15', alignItems: 'center', justifyContent: 'center',
  },
  supportTitle: { fontSize: 14, fontFamily: themes.fonts.poppinsSemi, color: '#fff' },
  supportDesc: { fontSize: 12, fontFamily: themes.fonts.poppinsRegular, color: '#6B7280', marginTop: 2 },
});

// ─── Estilos do Chat ──────────────────────────────────────────────────────
const ch = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f13' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 14,
    paddingTop: Platform.OS === 'ios' ? 50 : 32,
    borderBottomWidth: 1, borderBottomColor: '#ffffff08',
  },
  backCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1a222d', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B7BFF15', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#3B7BFF30' },
  headerName: { fontSize: 15, color: '#fff', fontFamily: themes.fonts.poppinsSemi },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4ade80' },
  onlineTxt: { fontSize: 11, color: '#4ade80', fontFamily: themes.fonts.poppinsRegular },

  messagesArea: { flex: 1, backgroundColor: '#0b0f13' },
  emptyText: { textAlign: 'center', color: '#6B7280', fontFamily: themes.fonts.poppinsRegular, marginTop: 60, paddingHorizontal: 40, lineHeight: 22 },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '80%' },
  msgRowMe: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1a222d', alignItems: 'center', justifyContent: 'center' },
  bubble: { borderRadius: 18, padding: 12, maxWidth: '100%' },
  bubbleMe: { backgroundColor: '#3B7BFF', borderBottomRightRadius: 4 },
  bubbleSupport: { backgroundColor: '#1a222d', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: '#fff', fontFamily: themes.fonts.poppinsRegular, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: themes.fonts.poppinsRegular, marginTop: 4, textAlign: 'right' },

  bottomArea: { borderTopWidth: 1, borderTopColor: '#ffffff08', backgroundColor: '#0b0f13' },
  quickRepliesScroll: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  quickRepliesRow: { gap: 8 },
  quickReplyBtn: { backgroundColor: '#1a222d', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#ffffff15' },
  quickReplyTxt: { fontSize: 13, fontFamily: themes.fonts.poppinsRegular, color: '#9CA3AF' },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 28 : 10 },
  input: { flex: 1, backgroundColor: '#1a222d', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontFamily: themes.fonts.poppinsRegular, fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: '#ffffff0D' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B7BFF', alignItems: 'center', justifyContent: 'center' },
});
