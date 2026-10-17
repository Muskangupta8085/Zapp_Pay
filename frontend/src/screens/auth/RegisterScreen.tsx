import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

interface RegisterScreenProps {
  onRegisterSubmit: (contact: string, devOtp?: string) => void;
  onNavigateToLogin: () => void;
  onBack?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSubmit,
  onNavigateToLogin,
  onBack,
}) => {
  const [authMethod, setAuthMethod] = useState<'mobile' | 'email'>('mobile');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showReferral, setShowReferral] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ fullName?: boolean; phone?: boolean; email?: boolean; password?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { registerWithCredentials } = useAuth();

  const nameInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const referralInputRef = useRef<TextInput>(null);

  // Validation rules
  const getFullNameError = () => {
    if (!fullName.trim()) return 'Full name is required';
    if (fullName.trim().length < 2) return 'Full name must be at least 2 characters';
    if (!/^[a-zA-Z\s.'-]+$/.test(fullName.trim())) return 'Name can only contain letters and spaces';
    return null;
  };

  const getPhoneError = () => {
    if (!phone.trim()) return 'Mobile number is required';
    if (phone.trim().length !== 10) return 'Must be a 10-digit mobile number';
    if (!/^[6-9]/.test(phone.trim())) return 'Must start with 6, 7, 8, or 9';
    return null;
  };

  const getEmailError = () => {
    if (!email.trim()) return 'Email address is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return 'Enter a valid email (e.g. name@example.com)';
    return null;
  };

  const getPasswordError = () => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters long';
    return null;
  };

  // Password strength score (1 to 3)
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 1;
    if (password.length >= 8 && /[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password) || (/[A-Z]/.test(password) && /[a-z]/.test(password))) score += 1;
    return score;
  };

  const fullNameError = getFullNameError();
  const phoneError = getPhoneError();
  const emailError = getEmailError();
  const passwordError = getPasswordError();
  const passwordStrength = getPasswordStrength();

  const isFullNameValid = !fullNameError && fullName.trim().length >= 2;
  const isPhoneValid = !phoneError && phone.trim().length === 10;
  const isEmailValid = !emailError && email.trim().length > 0;
  const isPasswordValid = !passwordError;

  const showFullNameError = (touched.fullName || submitted) && !!fullNameError;
  const showPhoneError = (touched.phone || submitted) && !!phoneError;
  const showEmailError = (touched.email || submitted) && !!emailError;
  const showPasswordError = (touched.password || submitted) && !!passwordError;

  const handleRegister = async () => {
    setSubmitted(true);

    if (fullNameError) {
      nameInputRef.current?.focus();
      return;
    }

    if (authMethod === 'mobile') {
      if (phoneError) {
        phoneInputRef.current?.focus();
        return;
      }
    } else {
      if (emailError) {
        emailInputRef.current?.focus();
        return;
      }
    }

    if (passwordError) {
      passwordInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        authMethod,
        fullName: fullName.trim(),
        phone: authMethod === 'mobile' ? phone.trim() : undefined,
        email: authMethod === 'email' ? email.trim() : undefined,
        password,
        referralCode: referralCode.trim() ? referralCode.trim() : undefined,
      };
      const result = await registerWithCredentials(payload);
      onRegisterSubmit(result.contactInfo, result.devOtp);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Please check your inputs and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/onboarding_bg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlayContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Bar with Navigation */}
            <View style={styles.topBar}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onBack ? onBack : onNavigateToLogin}
                style={styles.backButton}
              >
                <Text style={styles.backArrow}>‹</Text>
              </TouchableOpacity>

              {/* Centered Brand Title in Header */}
              <View style={styles.headerBrandRow}>
                <View style={styles.headerBrandBadge}>
                  <Image
                    source={require('../../../assets/images/logo_transparent.png')}
                    style={styles.headerLogoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.headerBrandName}>Zapp Pay</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onNavigateToLogin}
                style={styles.loginPill}
              >
                <Text style={styles.loginPillText}>Log In</Text>
              </TouchableOpacity>
            </View>

            {/* Title Hero Section */}
            <View style={styles.heroSection}>
              <Text style={styles.heroTitlePrefix}>
                Create Your{' '}
                <Text style={styles.heroTitleHighlight}>Account</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Buy, sell, and store crypto securely with Zapp Pay
              </Text>
            </View>

            {/* Form Container Card */}
            <View style={styles.formCard}>
              {/* Segmented Method Switcher */}
              <View style={styles.tabSelector}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.tabPill,
                    authMethod === 'mobile' && styles.activeTabPill,
                  ]}
                  onPress={() => setAuthMethod('mobile')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      authMethod === 'mobile' && styles.activeTabText,
                    ]}
                  >
                    Mobile Number
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.tabPill,
                    authMethod === 'email' && styles.activeTabPill,
                  ]}
                  onPress={() => setAuthMethod('email')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      authMethod === 'email' && styles.activeTabText,
                    ]}
                  >
                    Email Address
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form Input 0: Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => nameInputRef.current?.focus()}
                  style={[
                    styles.inputBox,
                    focusedField === 'fullName' && styles.inputBoxFocused,
                    showFullNameError && styles.inputBoxError,
                    isFullNameValid && styles.inputBoxSuccess,
                  ]}
                >
                  <View style={styles.nameIconWrapper} pointerEvents="none">
                    <Text style={styles.nameIcon}>👤</Text>
                  </View>
                  <TextInput
                    ref={nameInputRef}
                    placeholder="Enter your full name"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="words"
                    autoCorrect={false}
                    value={fullName}
                    onChangeText={(val) => {
                      setFullName(val);
                      if (!touched.fullName) setTouched((prev) => ({ ...prev, fullName: true }));
                    }}
                    style={styles.textInput}
                    onFocus={() => setFocusedField('fullName')}
                    onBlur={() => {
                      setFocusedField(null);
                      setTouched((prev) => ({ ...prev, fullName: true }));
                    }}
                  />
                  {isFullNameValid && (
                    <View style={styles.validBadge}>
                      <Text style={styles.validCheck}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {showFullNameError ? (
                  <Text style={styles.errorText}>⚠️ {fullNameError}</Text>
                ) : null}
              </View>

              {/* Form Input 1: Phone or Email */}
              {authMethod === 'mobile' ? (
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Text style={styles.inputLabel}>Mobile Number</Text>
                    {phone.length > 0 && (
                      <Text
                        style={[
                          styles.charCounter,
                          phone.length === 10 && styles.charCounterFull,
                        ]}
                      >
                        {phone.length}/10
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => phoneInputRef.current?.focus()}
                    style={[
                      styles.inputBox,
                      focusedField === 'phone' && styles.inputBoxFocused,
                      showPhoneError && styles.inputBoxError,
                      isPhoneValid && styles.inputBoxSuccess,
                    ]}
                  >
                    <View style={styles.countryBadge} pointerEvents="none">
                      <Text style={styles.flagEmoji}>🇮🇳</Text>
                      <Text style={styles.countryCode}>+91</Text>
                      <View style={styles.badgeDivider} />
                    </View>
                    <TextInput
                      ref={phoneInputRef}
                      placeholder="Enter 10-digit number"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={(val) => {
                        setPhone(val.replace(/[^0-9]/g, ''));
                        if (!touched.phone) setTouched((prev) => ({ ...prev, phone: true }));
                      }}
                      style={styles.textInput}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => {
                        setFocusedField(null);
                        setTouched((prev) => ({ ...prev, phone: true }));
                      }}
                    />
                    {isPhoneValid && (
                      <View style={styles.validBadge}>
                        <Text style={styles.validCheck}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {showPhoneError ? (
                    <Text style={styles.errorText}>⚠️ {phoneError}</Text>
                  ) : null}
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => emailInputRef.current?.focus()}
                    style={[
                      styles.inputBox,
                      focusedField === 'email' && styles.inputBoxFocused,
                      showEmailError && styles.inputBoxError,
                      isEmailValid && styles.inputBoxSuccess,
                    ]}
                  >
                    <TextInput
                      ref={emailInputRef}
                      placeholder="name@example.com"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        if (!touched.email) setTouched((prev) => ({ ...prev, email: true }));
                      }}
                      style={styles.textInput}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => {
                        setFocusedField(null);
                        setTouched((prev) => ({ ...prev, email: true }));
                      }}
                    />
                    {isEmailValid && (
                      <View style={styles.validBadge}>
                        <Text style={styles.validCheck}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {showEmailError ? (
                    <Text style={styles.errorText}>⚠️ {emailError}</Text>
                  ) : null}
                </View>
              )}

              {/* Form Input 2: Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => passwordInputRef.current?.focus()}
                  style={[
                    styles.inputBox,
                    focusedField === 'password' && styles.inputBoxFocused,
                    showPasswordError && styles.inputBoxError,
                    isPasswordValid && styles.inputBoxSuccess,
                  ]}
                >
                  <TextInput
                    ref={passwordInputRef}
                    placeholder="At least 6 characters"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (!touched.password) setTouched((prev) => ({ ...prev, password: true }));
                    }}
                    style={styles.textInput}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => {
                      setFocusedField(null);
                      setTouched((prev) => ({ ...prev, password: true }));
                    }}
                  />
                  {isPasswordValid && (
                    <View style={styles.validBadge}>
                      <Text style={styles.validCheck}>✓</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeToggleBtn}
                  >
                    <Text style={styles.eyeToggleText}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
                {showPasswordError ? (
                  <Text style={styles.errorText}>⚠️ {passwordError}</Text>
                ) : null}

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBarsRow}>
                      <View
                        style={[
                          styles.strengthBar,
                          passwordStrength >= 1 && {
                            backgroundColor:
                              passwordStrength === 1
                                ? '#EF4444'
                                : passwordStrength === 2
                                ? '#F59E0B'
                                : '#05CD99',
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.strengthBar,
                          passwordStrength >= 2 && {
                            backgroundColor:
                              passwordStrength === 2 ? '#F59E0B' : '#05CD99',
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.strengthBar,
                          passwordStrength >= 3 && { backgroundColor: '#05CD99' },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.strengthText,
                        {
                          color:
                            passwordStrength === 1
                              ? '#EF4444'
                              : passwordStrength === 2
                              ? '#F59E0B'
                              : '#05CD99',
                        },
                      ]}
                    >
                      {passwordStrength === 1
                        ? 'Weak'
                        : passwordStrength === 2
                        ? 'Moderate'
                        : 'Strong 🛡️'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Referral Code (Optional) */}
              {showReferral ? (
                <View style={styles.inputGroup}>
                  <View style={styles.referralHeaderRow}>
                    <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
                    <TouchableOpacity onPress={() => setShowReferral(false)}>
                      <Text style={styles.removeReferralText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => referralInputRef.current?.focus()}
                    style={[
                      styles.inputBox,
                      focusedField === 'referral' && styles.inputBoxFocused,
                    ]}
                  >
                    <TextInput
                      ref={referralInputRef}
                      placeholder="Enter referral code"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="characters"
                      value={referralCode}
                      onChangeText={setReferralCode}
                      style={styles.textInput}
                      onFocus={() => setFocusedField('referral')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowReferral(true)}
                  style={styles.addReferralBtn}
                >
                  <Text style={styles.addReferralText}>+ Add referral code</Text>
                </TouchableOpacity>
              )}

              {/* Action Button - Matches OnboardingScreen CTA */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.actionBtn, isLoading && { opacity: 0.8 }]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.actionBtnText}>Create Account ➔</Text>
                )}
              </TouchableOpacity>

              {/* Terms & Privacy Footnote */}
              <Text style={styles.termsNote}>
                By signing up, you agree to Zapp Pay's{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() =>
                    Alert.alert('Terms of Service', 'Zapp Pay Terms & Policies apply.')
                  }
                >
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() =>
                    Alert.alert('Privacy Policy', 'Your personal identity is strictly encrypted and secure.')
                  }
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            </View>

            {/* Bottom Navigation Prompt */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={onNavigateToLogin}>
                <Text style={styles.footerLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // Matches Onboarding lightness
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: height * 0.055,
    paddingBottom: 36,
  },

  // Top Bar Row
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 26,
    color: '#1B2559',
    fontWeight: '400',
    marginTop: -2,
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBrandBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  headerLogoImage: {
    width: 28,
    height: 28,
  },
  headerBrandName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B2559',
    letterSpacing: -0.3,
  },
  loginPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loginPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 22,
  },
  heroTitlePrefix: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1B2559',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroTitleHighlight: {
    color: Colors.primary,
  },
  heroSubtitle: {
    fontSize: 13.5,
    color: '#707EAE',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
    fontWeight: '500',
  },

  // Form Card
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
    marginBottom: 20,
  },

  // Segmented Tabs
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#F4F7FE',
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  activeTabPill: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#707EAE',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Inputs
  inputGroup: {
    marginBottom: 15,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1B2559',
  },
  charCounter: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A3AED0',
  },
  charCounterFull: {
    color: '#05CD99',
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    height: 52,
    paddingHorizontal: 14,
  },
  inputBoxFocused: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  inputBoxError: {
    borderColor: '#EE5D50',
    backgroundColor: '#FFF9F9',
  },
  inputBoxSuccess: {
    borderColor: '#05CD99',
  },
  errorText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#EE5D50',
    marginTop: 5,
    marginLeft: 2,
  },
  validBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E6FAF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  validCheck: {
    fontSize: 11,
    fontWeight: '900',
    color: '#05CD99',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    marginRight: 10,
  },
  strengthBar: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  strengthText: {
    fontSize: 11,
    fontWeight: '700',
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  flagEmoji: {
    fontSize: 17,
    marginRight: 4,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B2559',
    marginRight: 8,
  },
  badgeDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
  },
  nameIconWrapper: {
    paddingRight: 8,
    paddingLeft: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameIcon: {
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    paddingHorizontal: 4,
    fontSize: 15,
    fontWeight: '600',
    color: '#1B2559',
  },
  eyeToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  eyeToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Referral
  addReferralBtn: {
    paddingVertical: 4,
    marginBottom: 18,
    alignSelf: 'flex-start',
  },
  addReferralText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  referralHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeReferralText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: '600',
    marginBottom: 7,
  },

  // Action Button (Identical to OnboardingScreen actionBtn)
  actionBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 14,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Terms
  termsNote: {
    fontSize: 11.5,
    color: '#8F9BBA',
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Footer Navigation
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#707EAE',
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '800',
  },
});
