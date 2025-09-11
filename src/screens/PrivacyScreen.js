import { router } from 'expo-router';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import colors from '../theme/colors';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Cartão */}
        <View style={styles.card}>
          {/* Header com X e título */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Política de Privacidade</Text>
            <View style={{ width: 28 }} /> 
            {/* espaço vazio só p/ equilibrar o flex */}
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.paragraph}>
              O Inter Guia respeita a privacidade de seus usuários e protege as informações
              coletadas durante o uso do aplicativo.
            </Text>

            <Section
              index={1}
              title="Coleta de dados"
              text="Podemos coletar nome, e-mail, senha e conteúdos publicados (texto e imagem) dentro do app."
            />
            <Section
              index={2}
              title="Uso"
              text="Usamos os dados para login, organização dos relatos, segurança da plataforma e melhoria da experiência."
            />
            <Section
              index={3}
              title="Compartilhamento"
              text="Não compartilhamos dados pessoais com terceiros, exceto quando exigido por lei. Publicações feitas pelos usuários são visíveis à comunidade."
            />
            <Section
              index={4}
              title="Segurança"
              text="Senhas são criptografadas; a comunicação é feita via HTTPS. Cada conta controla apenas suas próprias publicações."
            />
            <Section
              index={5}
              title="Cookies"
              text="Usamos cookies para login, preferências e estatísticas de uso. O usuário pode desativar, mas algumas funções poderão ser limitadas."
            />
            <Section
              index={6}
              title="Direitos"
              text="O usuário pode editar ou excluir seus dados e solicitar a exclusão da conta a qualquer momento."
            />

            <Text style={styles.footerNote}>
              Última atualização: {new Date().toLocaleDateString()}
            </Text>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Section({ index, title, text }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {index}. {title}
      </Text>
      <Text style={styles.paragraph}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
    height: '88%',
    alignSelf: 'stretch'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  close: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  paragraph: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 8,
  },
  section: { marginTop: 10 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  footerNote: {
    marginTop: 14,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
