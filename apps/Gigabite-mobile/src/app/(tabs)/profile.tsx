import { LogOut, Mail, MapPin, Phone, UserRound } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { SectionTitle } from '@/components/section-title';
import { GigabiteColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function ProfileScreen() {
  const { isLoggingIn, login, logout, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin() {
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Enter your email and password before logging in.');
      return;
    }

    try {
      await login({ email: email.trim(), password });
      setPassword('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login failed.');
    }
  }

  return (
    <ScreenContainer>
      <AppHeader
        eyebrow="Profile"
        title={user ? `Hi, ${user.name}.` : 'Customer account.'}
        subtitle="Mobile checkout uses a customer login token kept in app memory for this session."
      />

      {user ? (
        <>
          <SectionTitle title="Signed in" subtitle="Mobile app stays customer-only." />
          <View style={styles.card}>
            <ProfileRow icon={<UserRound color={GigabiteColors.amber} size={22} />} label="Name" value={user.name} />
            <ProfileRow icon={<Mail color={GigabiteColors.sky} size={22} />} label="Email" value={user.email} />
            <ProfileRow icon={<Phone color={GigabiteColors.emerald} size={22} />} label="Phone" value={user.phone ?? 'Not set'} />
            <ProfileRow
              icon={<MapPin color={GigabiteColors.rose} size={22} />}
              label="Default address"
              value={user.defaultDeliveryAddress ?? 'Not set'}
            />
          </View>
          <Pressable onPress={logout} style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
            <LogOut color={GigabiteColors.text} size={18} />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </>
      ) : (
        <>
          <SectionTitle title="Login" subtitle="Required before submitting checkout." />
          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={GigabiteColors.textSubtle}
                style={styles.input}
                value={email}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={GigabiteColors.textSubtle}
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {isLoggingIn ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={GigabiteColors.amber} />
                <Text style={styles.loadingText}>Signing in</Text>
              </View>
            ) : (
              <PrimaryButton label="Log in" onPress={() => void handleLogin()} />
            )}
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}>{icon}</View>
      <View style={styles.rowText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GigabiteColors.card,
    borderColor: GigabiteColors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.surface,
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  rowText: {
    flex: 1,
  },
  label: {
    color: GigabiteColors.textSubtle,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  value: {
    color: GigabiteColors.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  fieldGroup: {
    gap: Spacing.two,
  },
  inputLabel: {
    color: GigabiteColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: GigabiteColors.text,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: Spacing.three,
  },
  errorText: {
    color: GigabiteColors.rose,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
    minHeight: 50,
  },
  loadingText: {
    color: GigabiteColors.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: Spacing.three,
  },
  logoutText: {
    color: GigabiteColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
