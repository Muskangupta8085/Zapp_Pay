import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

interface OtpVerificationScreenProps {
  contactInfo?: string;
  isRegistered?: boolean;
  devOtp?: string;
  onVerifySuccess?: () => void;
  onBack?: () => void;
}

export const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({
  contactInfo = '',
  isRegistered = false,
  devOtp,
  onVerifySuccess,
  onBack,
}) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(45);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const { verifyOtp, resendOtp } = useAuth();
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto advance to next box
    if (text.length > 0 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    try {
      await resendOtp(contactInfo, isRegistered ? 'login' : 'register');
      setTimer(45);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('Code Resent', 'A fresh 6-digit verification code has been dispatched.');
    } catch (err: any) {
      Alert.alert('Resend Failed', err.message || 'Please wait before requesting again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      Alert.alert('Incomplete Code', 'Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    try {
      await verifyOtp(contactInfo, enteredOtp, isRegistered);
      if (onVerifySuccess) {
        onVerifySuccess();
      } else {
        Alert.alert('Success', 'OTP Verified Successfully! Welcome to Zapp Pay.');
      }
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Invalid or expired OTP code.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
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
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Brand Emblem Graphic */}
        <View style={styles.shieldWrapper}>
          <View style={styles.shieldRing}>
            <Image
              source={require('../../../assets/images/logo_transparent.png')}
              style={styles.heroLogoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Text descriptions */}
        <Text style={styles.title}>Verification Code</Text>
        <Text style={styles.subtitle}>
          We have sent a 6-digit confirmation code to
        </Text>

        <View style={styles.contactRow}>
          <Text style={styles.contactText}>{contactInfo}</Text>
          <TouchableOpacity onPress={onBack} style={styles.editBtn}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* 6-box OTP Inputs */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpBox,
                digit.length > 0 && styles.otpBoxFilled,
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Resend Timer */}
        <View style={styles.resendSection}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendActive}>Didn't get code? Resend OTP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>
              Resend code in{' '}
              <Text style={styles.timerHighlight}>
                00:{timer < 10 ? `0${timer}` : timer}
              </Text>
            </Text>
          )}
        </View>

        {/* Dev Mode OTP Banner with 1-Tap Auto-fill */}
        <View style={{ backgroundColor: '#EEF2FF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, marginVertical: 12, borderWidth: 1, borderColor: '#C7D2FE', width: '100%', alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: '#4318FF', fontWeight: '600', textAlign: 'center', marginBottom: 4 }}>
            ⚡ Dev Mode Code: <Text style={{ fontWeight: '800' }}>{devOtp || '123456'}</Text>
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              const codeToFill = (devOtp || '123456').slice(0, 6).split('');
              setOtp(codeToFill);
            }}
            style={{ backgroundColor: '#4318FF', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8, marginTop: 4 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>Tap to Auto-Fill Code</Text>
          </TouchableOpacity>
        </View>

        {/* Verify Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.verifyBtn, isVerifying && { opacity: 0.8 }]}
          onPress={handleVerify}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.verifyBtnText}>Verify & Proceed ➔</Text>
          )}
        </TouchableOpacity>

        {/* Trust Note */}
        <View style={styles.trustNote}>
          <Text style={styles.trustIcon}>🔒</Text>
          <Text style={styles.trustText}>
            Secured by Zapp Pay 256-Bit Hardware Security
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 26,
    color: Colors.textPrimary,
    lineHeight: 28,
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 20,
  },
  shieldWrapper: {
    marginBottom: 24,
  },
  shieldRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  heroLogoImage: {
    width: 54,
    height: 54,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECEFF8',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 32,
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  editBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  editText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 28,
  },
  otpBox: {
    width: (width - 48 - 40) / 6,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    shadowColor: '#4318FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#F8F7FF',
  },
  resendSection: {
    marginBottom: 30,
  },
  resendTimer: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  timerHighlight: {
    color: Colors.primary,
    fontWeight: '700',
  },
  resendActive: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  verifyBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 24,
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  trustNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustIcon: {
    fontSize: 14,
  },
  trustText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
