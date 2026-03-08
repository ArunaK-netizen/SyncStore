import { format } from 'date-fns';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSales } from '../context/SalesContext';
import { useTheme } from '../hooks/useTheme';

interface CheckoutModalProps {
    visible: boolean;
    onClose: () => void;
}

import { useAuth } from '../context/AuthContext';

export default function CheckoutModal({ visible, onClose }: CheckoutModalProps) {
    const { cart, removeFromCart, updateCartItemQty, addTransaction } = useSales();
    const { user } = useAuth();
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';

    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
    const [tip, setTip] = useState('');
    const [loading, setLoading] = useState(false);

    const subtotalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Split taxes based on category
    let alcoholTax = 0;
    let foodTax = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const category = item.category?.toLowerCase();
        if (category === 'beer' || category === 'spirits') {
            alcoholTax += itemTotal * 0.09;
        } else {
            foodTax += itemTotal * 0.06;
        }
    });

    const totalTax = alcoholTax + foodTax;
    const finalAmount = subtotalAmount + totalTax + (parseFloat(tip) || 0);

    // If the cart becomes empty while the modal is open (e.g. after confirming a sale),
    // simply close the modal instead of briefly showing a "Cart is empty" state.
    useEffect(() => {
        if (visible && cart.length === 0) {
            onClose();
        }
    }, [visible, cart.length, onClose]);

    const handleConfirm = async () => {
        if (cart.length === 0) return;
        if (!user) {
            Alert.alert('Not logged in', 'You must be logged in to confirm a sale.');
            return;
        }

        setLoading(true);
        let timeoutId;
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            timeoutId = setTimeout(() => {
                setLoading(false);
                Alert.alert('Timeout', 'Sale confirmation took too long. Please check your connection.');
            }, 10000); // 10 seconds fallback

            await addTransaction({
                items: cart,
                totalAmount: finalAmount,
                paymentMethod,
                tip: parseFloat(tip) || 0,
                date: format(new Date(), 'yyyy-MM-dd'),
            });
            clearTimeout(timeoutId);

            // Silent success: reset state and close without showing an alert
            setPaymentMethod('cash');
            setTip('');
            onClose();
        } catch (error) {
            clearTimeout(timeoutId);
            Alert.alert('Error', 'Failed to confirm sale. Please try again.');
            console.error('Confirm sale error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    const handleRemoveItem = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        removeFromCart(id);
        // If cart becomes empty, maybe we should close? 
        // Original logic: if cart is empty, showed "Cart is empty" screen.
        // Here, if cart is empty, we can just close the modal or show empty state.
        // But since the button to open this modal is only visible if cart.length > 0 in dashboard,
        // it's likely fine. However, removing items until 0 inside the modal is possible.
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={handleCancel}
        >
            <View style={styles.container}>
                <BlurView
                    intensity={100}
                    tint={isDark ? 'dark' : 'light'}
                    style={styles.blurView}
                />

                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={handleCancel}
                />

                {Platform.OS === 'ios' ? (
                    <KeyboardAvoidingView
                        behavior="padding"
                        style={styles.keyboardView}
                    >
                        <View style={[styles.modal, isDark && styles.modalDark]}>
                            <View style={styles.header}>
                                <Text style={[styles.title, isDark && styles.titleDark]}>Checkout</Text>
                                <Text style={[styles.itemCount, isDark && styles.itemCountDark]}>{cart.length} items</Text>
                            </View>

                            <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
                                {cart.map((item) => (
                                    <View key={item.id} style={[styles.itemRow, isDark && styles.itemRowDark]}>
                                        <View style={styles.itemInfo}>
                                            <Text style={[styles.itemName, isDark && styles.itemNameDark]}>{item.productName}</Text>
                                            <Text style={[styles.itemDetails, isDark && styles.itemDetailsDark]}>
                                                ${item.price.toFixed(2)} each
                                            </Text>
                                        </View>
                                        <View style={styles.itemRight}>
                                            <Text style={[styles.itemTotal, isDark && styles.itemTotalDark]}>
                                                ${(item.quantity * item.price).toFixed(2)}
                                            </Text>
                                            <View style={styles.qtyControls}>
                                                <TouchableOpacity
                                                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateCartItemQty(item.id, -1); }}
                                                    style={[styles.qtyBtn, isDark && styles.qtyBtnDark]}
                                                >
                                                    <Text style={[styles.qtyBtnText, isDark && styles.qtyBtnTextDark]}>−</Text>
                                                </TouchableOpacity>
                                                <Text style={[styles.qtyValue, isDark && styles.qtyValueDark]}>{item.quantity}</Text>
                                                <TouchableOpacity
                                                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateCartItemQty(item.id, 1); }}
                                                    style={[styles.qtyBtn, isDark && styles.qtyBtnDark]}
                                                >
                                                    <Text style={[styles.qtyBtnText, isDark && styles.qtyBtnTextDark]}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>

                            <View style={styles.footer}>
                                {/* Payment Method */}
                                <View style={styles.section}>
                                    <Text style={[styles.label, isDark && styles.labelDark]}>Payment Method</Text>
                                    <View style={styles.paymentButtons}>
                                        {(['cash', 'card', 'upi'] as const).map(method => {
                                            const isSelected = paymentMethod === method;
                                            return (
                                                <TouchableOpacity
                                                    key={method}
                                                    onPress={() => setPaymentMethod(method)}
                                                    style={[
                                                        styles.paymentButton,
                                                        isSelected && styles.paymentButtonSelected,
                                                        isDark && !isSelected && styles.paymentButtonDark,
                                                    ]}
                                                >
                                                    <Text style={[
                                                        styles.paymentButtonText,
                                                        isSelected && styles.paymentButtonTextSelected,
                                                        isDark && !isSelected && styles.paymentButtonTextDark,
                                                    ]}>
                                                        {method.toUpperCase()}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                {/* Tip */}
                                <View style={styles.section}>
                                    <Text style={[styles.label, isDark && styles.labelDark]}>Tip (Optional)</Text>
                                    <View style={[styles.tipInput, isDark && styles.tipInputDark]}>
                                        <Text style={[styles.dollarSign, isDark && styles.dollarSignDark]}>$</Text>
                                        <TextInput
                                            value={tip}
                                            onChangeText={setTip}
                                            placeholder="0.00"
                                            placeholderTextColor={isDark ? '#8e8e93' : '#c7c7cc'}
                                            keyboardType="numeric"
                                            style={[styles.tipTextInput, isDark && styles.tipTextInputDark]}
                                        />
                                    </View>
                                </View>

                                <View style={styles.totalSection}>
                                    <View style={[styles.totalRow, { marginBottom: 8 }]}>
                                        <Text style={[styles.subtotalLabel, isDark && styles.subtotalLabelDark]}>Subtotal</Text>
                                        <Text style={[styles.subtotalValue, isDark && styles.subtotalValueDark]}>${subtotalAmount.toFixed(2)}</Text>
                                    </View>

                                    {alcoholTax > 0 && (
                                        <View style={[styles.totalRow, { marginBottom: 8 }]}>
                                            <Text style={[styles.subtotalLabel, isDark && styles.subtotalLabelDark]}>Alcohol Tax (9%)</Text>
                                            <Text style={[styles.subtotalValue, isDark && styles.subtotalValueDark]}>${alcoholTax.toFixed(2)}</Text>
                                        </View>
                                    )}

                                    {foodTax > 0 && (
                                        <View style={[styles.totalRow, { marginBottom: 16 }]}>
                                            <Text style={[styles.subtotalLabel, isDark && styles.subtotalLabelDark]}>Food Tax (6%)</Text>
                                            <Text style={[styles.subtotalValue, isDark && styles.subtotalValueDark]}>${foodTax.toFixed(2)}</Text>
                                        </View>
                                    )}

                                    <View style={styles.totalRow}>
                                        <Text style={[styles.totalLabel, isDark && styles.totalLabelDark]}>Total Amount</Text>
                                        <Text style={styles.totalValue}>${finalAmount.toFixed(2)}</Text>
                                    </View>

                                    <View style={styles.actions}>
                                        <TouchableOpacity
                                            onPress={handleCancel}
                                            style={[styles.cancelButton, isDark && styles.cancelButtonDark]}
                                        >
                                            <Text style={[styles.cancelButtonText, isDark && styles.cancelButtonTextDark]}>Back</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleConfirm}
                                            style={[styles.confirmButton, loading && { opacity: 0.6 }]}
                                            disabled={loading}
                                        >
                                            <Text style={styles.confirmButtonText}>
                                                {loading ? 'Processing...' : 'Confirm Sale'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                ) : (
                    <View style={styles.keyboardView}>
                        <View style={[styles.modal, isDark && styles.modalDark]}>
                            <View style={styles.header}>
                                <Text style={[styles.title, isDark && styles.titleDark]}>Checkout</Text>
                                <Text style={[styles.itemCount, isDark && styles.itemCountDark]}>{cart.length} items</Text>
                            </View>

                            <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
                                {cart.map((item) => (
                                    <View key={item.id} style={[styles.itemRow, isDark && styles.itemRowDark]}>
                                        <View style={styles.itemInfo}>
                                            <Text style={[styles.itemName, isDark && styles.itemNameDark]}>{item.productName}</Text>
                                            <Text style={[styles.itemDetails, isDark && styles.itemDetailsDark]}>
                                                ${item.price.toFixed(2)} each
                                            </Text>
                                        </View>
                                        <View style={styles.itemRight}>
                                            <Text style={[styles.itemTotal, isDark && styles.itemTotalDark]}>
                                                ${(item.quantity * item.price).toFixed(2)}
                                            </Text>
                                            <View style={styles.qtyControls}>
                                                <TouchableOpacity
                                                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateCartItemQty(item.id, -1); }}
                                                    style={[styles.qtyBtn, isDark && styles.qtyBtnDark]}
                                                >
                                                    <Text style={[styles.qtyBtnText, isDark && styles.qtyBtnTextDark]}>−</Text>
                                                </TouchableOpacity>
                                                <Text style={[styles.qtyValue, isDark && styles.qtyValueDark]}>{item.quantity}</Text>
                                                <TouchableOpacity
                                                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateCartItemQty(item.id, 1); }}
                                                    style={[styles.qtyBtn, isDark && styles.qtyBtnDark]}
                                                >
                                                    <Text style={[styles.qtyBtnText, isDark && styles.qtyBtnTextDark]}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>

                            <View style={styles.footer}>
                                {/* Payment Method */}
                                <View style={styles.section}>
                                    <Text style={[styles.label, isDark && styles.labelDark]}>Payment Method</Text>
                                    <View style={styles.paymentButtons}>
                                        {(['cash', 'card', 'upi'] as const).map(method => {
                                            const isSelected = paymentMethod === method;
                                            return (
                                                <TouchableOpacity
                                                    key={method}
                                                    onPress={() => setPaymentMethod(method)}
                                                    style={[
                                                        styles.paymentButton,
                                                        isSelected && styles.paymentButtonSelected,
                                                        isDark && !isSelected && styles.paymentButtonDark,
                                                    ]}
                                                >
                                                    <Text style={[
                                                        styles.paymentButtonText,
                                                        isSelected && styles.paymentButtonTextSelected,
                                                        isDark && !isSelected && styles.paymentButtonTextDark,
                                                    ]}>
                                                        {method.toUpperCase()}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                {/* Tip */}
                                <View style={styles.section}>
                                    <Text style={[styles.label, isDark && styles.labelDark]}>Tip (Optional)</Text>
                                    <View style={[styles.tipInput, isDark && styles.tipInputDark]}>
                                        <Text style={[styles.dollarSign, isDark && styles.dollarSignDark]}>$</Text>
                                        <TextInput
                                            value={tip}
                                            onChangeText={setTip}
                                            placeholder="0.00"
                                            placeholderTextColor={isDark ? '#8e8e93' : '#c7c7cc'}
                                            keyboardType="numeric"
                                            style={[styles.tipTextInput, isDark && styles.tipTextInputDark]}
                                        />
                                    </View>
                                </View>

                                <View style={styles.totalSection}>
                                    <View style={[styles.totalRow, { marginBottom: 8 }]}>
                                        <Text style={[styles.subtotalLabel, isDark && styles.subtotalLabelDark]}>Subtotal</Text>
                                        <Text style={[styles.subtotalValue, isDark && styles.subtotalValueDark]}>${subtotalAmount.toFixed(2)}</Text>
                                    </View>

                                    {alcoholTax > 0 && (
                                        <View style={[styles.totalRow, { marginBottom: 8 }]}>
                                            <Text style={[styles.subtotalLabel, isDark && styles.subtotalLabelDark]}>Alcohol Tax (9%)</Text>
                                            <Text style={[styles.subtotalValue, isDark && styles.subtotalValueDark]}>${alcoholTax.toFixed(2)}</Text>
                                        </View>
                                    )}

                                    {foodTax > 0 && (
                                        <View style={[styles.totalRow, { marginBottom: 16 }]}>
                                            <Text style={[styles.subtotalLabel, isDark && styles.subtotalLabelDark]}>Food Tax (6%)</Text>
                                            <Text style={[styles.subtotalValue, isDark && styles.subtotalValueDark]}>${foodTax.toFixed(2)}</Text>
                                        </View>
                                    )}

                                    <View style={styles.totalRow}>
                                        <Text style={[styles.totalLabel, isDark && styles.totalLabelDark]}>Total Amount</Text>
                                        <Text style={styles.totalValue}>${finalAmount.toFixed(2)}</Text>
                                    </View>

                                    <View style={styles.actions}>
                                        <TouchableOpacity
                                            onPress={handleCancel}
                                            style={[styles.cancelButton, isDark && styles.cancelButtonDark]}
                                        >
                                            <Text style={[styles.cancelButtonText, isDark && styles.cancelButtonTextDark]}>Back</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleConfirm}
                                            style={[styles.confirmButton, loading && { opacity: 0.6 }]}
                                            disabled={loading}
                                        >
                                            <Text style={styles.confirmButtonText}>
                                                {loading ? 'Processing...' : 'Confirm Sale'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    blurView: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    backdrop: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    keyboardView: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-end',
        // Match app/checkout.tsx behavior which was full screen-ish but here we want it modal-like.
        // app/checkout.tsx had justifyContent: 'flex-end' for keyboardView and height '85%' for modal.
    },
    modal: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        height: '85%',
        width: '100%', // Ensure full width
    },
    modalDark: {
        backgroundColor: '#1c1c1e',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f2f2f7',
    },
    title: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        color: '#000000',
    },
    titleDark: {
        color: '#ffffff',
    },
    itemCount: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#8e8e93',
    },
    itemCountDark: {
        color: '#98989d',
    },
    itemsList: {
        flex: 1,
        marginBottom: 20,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f2f2f7',
    },
    itemRowDark: {
        borderBottomColor: '#2c2c2e',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#000000',
        marginBottom: 4,
    },
    itemNameDark: {
        color: '#ffffff',
    },
    itemDetails: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#8e8e93',
    },
    itemDetailsDark: {
        color: '#98989d',
    },
    itemRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    itemTotal: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        color: '#000000',
    },
    itemTotalDark: {
        color: '#ffffff',
    },
    removeButton: {
        padding: 4,
    },
    removeButtonText: {
        fontSize: 14,
        color: '#FF3B30',
        fontWeight: 'bold',
    },
    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    qtyBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#f2f2f7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyBtnDark: {
        backgroundColor: '#3a3a3c',
    },
    qtyBtnText: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#007AFF',
        lineHeight: 22,
    },
    qtyBtnTextDark: {
        color: '#0A84FF',
    },
    qtyValue: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        color: '#000000',
        minWidth: 20,
        textAlign: 'center',
    },
    qtyValueDark: {
        color: '#ffffff',
    },
    footer: {
        gap: 20,
    },
    section: {
        gap: 8,
    },
    label: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
        color: '#000000',
    },
    labelDark: {
        color: '#ffffff',
    },
    paymentButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    paymentButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#f2f2f7',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    paymentButtonDark: {
        backgroundColor: '#2c2c2e',
    },
    paymentButtonSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    paymentButtonText: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: '#000000',
    },
    paymentButtonTextDark: {
        color: '#ffffff',
    },
    paymentButtonTextSelected: {
        color: '#ffffff',
    },
    tipInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f2f2f7',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    tipInputDark: {
        backgroundColor: '#2c2c2e',
    },
    dollarSign: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#8e8e93',
        marginRight: 8,
    },
    dollarSignDark: {
        color: '#98989d',
    },
    tipTextInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#000000',
    },
    tipTextInputDark: {
        color: '#ffffff',
    },
    totalSection: {
        borderTopWidth: 1,
        borderTopColor: '#f2f2f7',
        paddingTop: 20,
        gap: 16,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#000000',
    },
    totalLabelDark: {
        color: '#ffffff',
    },
    subtotalLabel: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#8e8e93',
    },
    subtotalLabelDark: {
        color: '#98989d',
    },
    totalValue: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        color: '#007AFF',
    },
    subtotalValue: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#000000',
    },
    subtotalValueDark: {
        color: '#ffffff',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: '#f2f2f7',
        borderRadius: 14,
        alignItems: 'center',
    },
    cancelButtonDark: {
        backgroundColor: '#2c2c2e',
    },
    cancelButtonText: {
        fontSize: 17,
        fontFamily: 'Outfit_600SemiBold',
        color: '#000000',
    },
    cancelButtonTextDark: {
        color: '#ffffff',
    },
    confirmButton: {
        flex: 2,
        paddingVertical: 16,
        backgroundColor: '#007AFF',
        borderRadius: 14,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 17,
        fontFamily: 'Outfit_700Bold',
        color: '#ffffff',
    },
    emptyText: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
        color: '#000000',
        marginBottom: 20,
        textAlign: 'center',
    },
    emptyTextDark: {
        color: '#ffffff',
    },
    backButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#007AFF',
        borderRadius: 12,
        alignSelf: 'center',
    },
    backButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
    },
});
