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
  const { isLoggingIn, isRestoringSession, login, logout, register, user } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultDeliveryAddress, setDefaultDeliveryAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  async function handleRegister() {
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage('Name, email, password, and confirmation are required.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        defaultDeliveryAddress: defaultDeliveryAddress.trim() || null,
        password,
        confirmPassword,
      });
      setName('');
      setEmail('');
      setPhone('');
      setDefaultDeliveryAddress('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Registration failed.');
    }
  }

  function switchMode(mode: 'login' | 'register') {
    setAuthMode(mode);
    setErrorMessage(null);
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <ScreenContainer>
      <AppHeader
        eyebrow="Profile"
        title={user ? `Hi, ${user.name}.` : 'Customer account.'}
        subtitle="Mobile checkout uses a secure persisted customer session."
      />

      {isRestoringSession ? (
        <View style={styles.card}>
          <View style={styles.loadingRow}>
            <ActivityIndicator color={GigabiteColors.amber} />
            <Text style={styles.loadingText}>Restoring session</Text>
          </View>
        </View>
      ) : null}

      {!isRestoringSession && user ? (
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
          <Pressable onPress={() => void logout()} style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
            <LogOut color={GigabiteColors.text} size={18} />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </>
      ) : null}

      {!isRestoringSession && !user ? (
        <>
          <SectionTitle
            title={authMode === 'login' ? 'Login' : 'Create account'}
            subtitle={
              authMode === 'login'
                ? 'Required before submitting checkout.'
                : 'Customer accounts only. Staff and managers use the web app.'
            }
          />
          <View style={styles.modeToggle}>
            <Pressable
              onPress={() => switchMode('login')}
              style={({ pressed }) => [
                styles.modeButton,
                authMode === 'login' && styles.modeButtonActive,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.modeText, authMode === 'login' && styles.modeTextActive]}>Login</Text>
            </Pressable>
            <Pressable
              onPress={() => switchMode('register')}
              style={({ pressed }) => [
                styles.modeButton,
                authMode === 'register' && styles.modeButtonActive,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.modeText, authMode === 'register' && styles.modeTextActive]}>
                Register
              </Text>
            </Pressable>
          </View>
          <View style={styles.card}>
            {authMode === 'register' ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  autoComplete="name"
                  onChangeText={setName}
                  placeholder="Alex Morgan"
                  placeholderTextColor={GigabiteColors.textSubtle}
                  style={styles.input}
                  value={name}
                />
              </View>
            ) : null}
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
            {authMode === 'register' ? (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>Phone</Text>
                  <TextInput
                    autoComplete="tel"
                    keyboardType="phone-pad"
                    onChangeText={setPhone}
                    placeholder="+359 88 123 4567"
                    placeholderTextColor={GigabiteColors.textSubtle}
                    style={styles.input}
                    value={phone}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>Default delivery address</Text>
                  <TextInput
                    autoComplete="street-address"
                    onChangeText={setDefaultDeliveryAddress}
                    placeholder="24 Flavor Street, Sofia"
                    placeholderTextColor={GigabiteColors.textSubtle}
                    style={[styles.input, styles.multilineInput]}
                    multiline
                    value={defaultDeliveryAddress}
                  />
                </View>
              </>
            ) : null}
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
            {authMode === 'register' ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Confirm password</Text>
                <TextInput
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat password"
                  placeholderTextColor={GigabiteColors.textSubtle}
                  secureTextEntry
                  style={styles.input}
                  value={confirmPassword}
                />
              </View>
            ) : null}
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {isLoggingIn ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={GigabiteColors.amber} />
                <Text style={styles.loadingText}>
                  {authMode === 'login' ? 'Signing in' : 'Creating account'}
                </Text>
              </View>
            ) : (
              <PrimaryButton
                label={authMode === 'login' ? 'Log in' : 'Create account'}
                onPress={() => {
                  void (authMode === 'login' ? handleLogin() : handleRegister());
                }}
              />
            )}
          </View>
        </>
      ) : null}
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
  multilineInput: {
    minHeight: 76,
    paddingTop: Spacing.three,
    textAlignVertical: 'top',
  },
  modeToggle: {
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.one,
    padding: Spacing.one,
  },
  modeButton: {
    alignItems: 'center',
    borderRadius: 11,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: GigabiteColors.amber,
  },
  modeText: {
    color: GigabiteColors.textMuted,
    fontSize: 14,
    fontWeight: '900',
  },
  modeTextActive: {
    color: GigabiteColors.background,
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
