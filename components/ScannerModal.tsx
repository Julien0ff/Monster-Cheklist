import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../constants/Colors';
import { Monster } from '../hooks/useMonsterStore';
import { X, Zap, Check, Scan } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { findMonsterByBarcode, MonsterProduct } from '../constants/monsterDatabase';

interface ScannerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onScanComplete: (monster: Monster) => void;
}

export const ScannerModal = ({ isVisible, onClose, onScanComplete }: ScannerModalProps) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [foundProduct, setFoundProduct] = useState<MonsterProduct | null>(null);

  // Animations
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const cornerPulseAnim = useRef(new Animated.Value(1)).current;
  const resultFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Scan line animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Corner pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(cornerPulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
          Animated.timing(cornerPulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && (!permission || !permission.granted)) {
      requestPermission();
    }
    // Reset state when modal opens
    if (isVisible) {
      setScanned(false);
      setIsProcessing(false);
      setFoundProduct(null);
      resultFade.setValue(0);
    }
  }, [isVisible, permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // 1. Check local database FIRST
      const localMatch = findMonsterByBarcode(data);

      if (localMatch) {
        // Found locally! Instant response.
        setFoundProduct(localMatch);
        Animated.timing(resultFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();

        // Auto-add after short delay so user sees what was scanned
        setTimeout(() => {
          const newMonster: Monster = {
            id: Date.now().toString(),
            name: localMatch.name,
            barcode: data,
            dateAdded: new Date().toLocaleDateString('fr-FR'),
            image: localMatch.image,
            caffeine: localMatch.caffeine,
            category: localMatch.category,
            color: localMatch.color,
          };
          onScanComplete(newMonster);
        }, 1200);
        return;
      }

      // 2. Fallback to OpenFoodFacts API
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
      const result = await response.json();

      let monsterName = `Monster Energy (Code: ${data.slice(-6)})`;
      let monsterImage = `https://images.openfoodfacts.org/images/products/${data.substring(0,3)}/${data.substring(3,6)}/${data.substring(6,9)}/${data.substring(9)}/front_fr.4.400.jpg`;
      let caffeine = 160;

      if (result.status === 1) {
        monsterName = result.product.product_name || monsterName;
        if (result.product.image_front_url) {
          monsterImage = result.product.image_front_url;
        } else if (result.product.image_url) {
          monsterImage = result.product.image_url;
        }
        // Try to extract caffeine
        if (result.product.nutriments?.caffeine_100g) {
          caffeine = Math.round(result.product.nutriments.caffeine_100g * 5); // 500ml can
        }
      }

      const newMonster: Monster = {
        id: Date.now().toString(),
        name: monsterName,
        barcode: data,
        dateAdded: new Date().toLocaleDateString('fr-FR'),
        image: monsterImage,
        caffeine,
      };

      onScanComplete(newMonster);
    } catch (error) {
      console.error('Lookup failed', error);
      onScanComplete({
        id: Date.now().toString(),
        name: `Monster (Scan: ${data.slice(-6)})`,
        barcode: data,
        dateAdded: new Date().toLocaleDateString('fr-FR'),
        image: `https://images.openfoodfacts.org/images/products/${data.substring(0,3)}/${data.substring(3,6)}/${data.substring(6,9)}/${data.substring(9)}/front_fr.4.400.jpg`,
        caffeine: 160,
      });
    } finally {
      setIsProcessing(false);
      setScanned(false);
    }
  };

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <Modal visible={isVisible} animationType="slide">
        <View style={[styles.container, styles.center]}>
          <View style={styles.permissionCard}>
            <Scan size={40} stroke={Colors.primary} strokeWidth={1.5} />
            <Text style={styles.permissionTitle}>ACCÈS CAMÉRA</Text>
            <Text style={styles.permissionText}>
              Autorise l'accès à la caméra pour scanner les codes-barres de tes canettes Monster.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>AUTORISER LA CAMÉRA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>ANNULER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160],
  });

  return (
    <Modal visible={isVisible} animationType="none" transparent={true}>
      <SafeAreaView style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a"],
          }}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Close button */}
          <TouchableOpacity style={styles.headerClose} onPress={onClose}>
            <View style={styles.closeCircle}>
              <X size={24} stroke={Colors.white} strokeWidth={2} />
            </View>
          </TouchableOpacity>

          {/* Scanner UI text */}
          <Text style={styles.scanTitle}>SCANNER</Text>

          {/* Scanner target */}
          <Animated.View style={[styles.scannerTarget, { transform: [{ scale: cornerPulseAnim }] }]}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Animated scan line */}
            <Animated.View
              style={[
                styles.laserLine,
                { transform: [{ translateY: scanLineTranslateY }] },
              ]}
            />
          </Animated.View>

          <Text style={styles.instructionText}>
            Place le code-barres dans la zone de scan
          </Text>

          {/* Found product indicator */}
          {foundProduct && (
            <Animated.View style={[styles.foundCard, { opacity: resultFade }]}>
              <Check size={20} stroke={Colors.primary} strokeWidth={3} />
              <View style={styles.foundInfo}>
                <Text style={styles.foundName}>{foundProduct.name}</Text>
                <Text style={styles.foundMeta}>IDENTIFIÉ • {foundProduct.caffeine}mg caféine</Text>
              </View>
            </Animated.View>
          )}

          {/* Processing indicator */}
          {isProcessing && !foundProduct && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loaderText}>IDENTIFICATION EN COURS...</Text>
            </View>
          )}

          {/* Bottom info */}
          <View style={styles.bottomInfo}>
            <Text style={styles.bottomText}>EAN-13 • EAN-8 • UPC-A</Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Close
  headerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  closeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Scan title
  scanTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 6,
    marginBottom: 24,
    opacity: 0.6,
  },

  // Scanner target
  scannerTarget: {
    width: 280,
    height: 180,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },

  // Laser line
  laserLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },

  // Instructions
  instructionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 28,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },

  // Found product
  foundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 65, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 65, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    marginHorizontal: 32,
    gap: 12,
  },
  foundInfo: {
    flex: 1,
  },
  foundName: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  foundMeta: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
  },

  // Loader
  loaderContainer: {
    position: 'absolute',
    bottom: 120,
    alignItems: 'center',
  },
  loaderText: {
    color: Colors.primary,
    marginTop: 12,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 3,
  },

  // Permission
  permissionCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  permissionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  permissionText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  permissionButtonText: {
    color: Colors.background,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },

  // Bottom
  bottomInfo: {
    position: 'absolute',
    bottom: 50,
  },
  bottomText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 3,
  },
});
