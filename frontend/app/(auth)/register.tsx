import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { register } from '../../services/authService';
import { Colors } from '../../constants/Colors';

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
// Phone: 10-digit Indian format (matches backend's uniqueness requirement)
const PHONE_REGEX = /^\d{10}$/;

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  const clearError = () => setError(null);

  const handleRegister = async () => {
    setError(null);

    // Client-side validation
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!phone.trim() || !PHONE_REGEX.test(phone.trim())) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), phone.trim(), password);
      setSuccess(true);
      // Short delay so the user can read the success message, then go to login
      setTimeout(() => router.replace('/(auth)/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successFullScreen}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>Account Created!</Text>
        <Text style={styles.successSubtext}>Taking you to Sign In…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🏦</Text>
          <Text style={styles.appName}>BankEase</Text>
          <Text style={styles.tagline}>Secure Mobile Banking</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join BankEase today</Text>

          {/* Error banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={v => { setName(v); clearError(); }}
              autoCapitalize="words"
              autoCorrect={false}
              autoComplete="off"
              textContentType="oneTimeCode"
              editable={!loading}
              returnKeyType="next"
            />
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={v => { setEmail(v); clearError(); }}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              keyboardType="email-address"
              textContentType="oneTimeCode"
              editable={!loading}
              returnKeyType="next"
            />
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor={Colors.textLight}
              value={phone}
              onChangeText={v => { setPhone(v); clearError(); }}
              keyboardType="phone-pad"
              autoComplete="off"
              textContentType="oneTimeCode"
              editable={!loading}
              returnKeyType="next"
              maxLength={10}
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor={Colors.textLight}
              value={password}
              onChangeText={v => { setPassword(v); clearError(); }}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
          </View>

          {/* Register button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.backgroundLight} size="small" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Back to login */}
        <TouchableOpacity
          style={styles.switchRow}
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.7}
        >
          <Text style={styles.switchText}>Already have an account? </Text>
          <Text style={styles.switchLink}>Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Demo Account — Academic Project</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

  // Full-screen success
  successFullScreen: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.background, padding: 32,
  },
  successIcon:    { fontSize: 64, color: Colors.success, marginBottom: 16 },
  successTitle:   { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  successSubtext: { fontSize: 14, color: Colors.textSecondary },

  // Header (mirrors login.tsx exactly)
  header: { alignItems: 'center', marginBottom: 36 },
  logo:    { fontSize: 52, marginBottom: 8 },
  appName: { fontSize: 28, fontWeight: '700', color: Colors.primary, letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },

  // Card
  card: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 28,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
  title:    { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },

  // Error
  errorBanner: {
    backgroundColor: Colors.error + '18', borderLeftWidth: 3, borderLeftColor: Colors.error,
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 20,
  },
  errorText: { fontSize: 14, color: Colors.error, fontWeight: '500' },

  // Fields (identical to login.tsx)
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 16, color: Colors.text, backgroundColor: Colors.background,
  },

  // Button
  button: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { fontSize: 16, fontWeight: '700', color: Colors.backgroundLight, letterSpacing: 0.3 },

  // Switch to login
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  switchText: { fontSize: 14, color: Colors.textSecondary },
  switchLink: { fontSize: 14, color: Colors.primary, fontWeight: '700' },

  footer: { textAlign: 'center', fontSize: 12, color: Colors.textLight, marginTop: 16 },
});
