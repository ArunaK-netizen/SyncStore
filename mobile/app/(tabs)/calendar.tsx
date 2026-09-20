import { format, parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import EditTransactionModal from '../../components/EditTransactionModal';
import AdminStaffView from '../../components/admin/AdminStaffView';
import { useAdminMode } from '../../context/AdminModeContext';
import { useSales } from '../../context/SalesContext';
import { useAdminAccess } from '../../hooks/useAdminAccess';
import { useTheme } from '../../hooks/useTheme';

export default function CalendarScreen() {
    const { isAdmin } = useAdminAccess();
    const { isAdminMode } = useAdminMode();

    // Security Gate: Only show Admin Staff view if the logged in user is confirmed as an Admin
    if (isAdmin && isAdminMode) return <AdminStaffView />;

    return <EmployeeCalendarScreen />;
}

function EmployeeCalendarScreen() {
    const { transactions } = useSales();
    const { colorScheme } = useTheme();
    const router = useRouter();
    const isDark = colorScheme === 'dark';
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const [editingTransaction, setEditingTransaction] = useState<any>(null);

    // Mark days with transactions
    const markedDates = transactions.reduce((acc, t) => {
        acc[t.date] = {
            marked: true,
            dotColor: '#007AFF',
        };
        return acc;
    }, {} as any);

    //  Mark selected date
    if (selectedDate) {
        markedDates[selectedDate] = {
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: '#007AFF',
        };
    }

    // Get transactions for selected date
    const selectedDateTransactions = transactions.filter(t => t.date === selectedDate);

    const totalForDate = selectedDateTransactions.reduce(
        (sum, t) => {
            if (t.items) {
                return sum + t.items.reduce((s, i) => s + (i.price * i.quantity), 0);
            }
            return sum + ((t.price || 0) * (t.quantity || 0));
        }, 0
    );

    const handleTransactionPress = (transaction: any) => {
        Haptics.selectionAsync();
        setEditingTransaction(transaction);
    };

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <LinearGradient
                colors={isDark ? ['#1c1c1e', '#2c2c2e'] : ['#f2f2f7', '#e5e5ea']}
                style={styles.headerGradient}
            />
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <View style={styles.header}>
                    <Text style={[styles.title, isDark && styles.titleDark]}>History</Text>
                </View>

                <View style={[styles.calendarCard, isDark && styles.calendarCardDark]}>
                    <Calendar
                        key={colorScheme}
                        theme={{
                            backgroundColor: 'transparent',
                            calendarBackground: 'transparent',
                            textSectionTitleColor: isDark ? '#98989d' : '#8e8e93',
                            selectedDayBackgroundColor: '#007AFF',
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: '#007AFF',
                            dayTextColor: isDark ? '#ffffff' : '#000000',
                            textDisabledColor: isDark ? '#48484a' : '#c7c7cc',
                            dotColor: '#007AFF',
                            selectedDotColor: '#ffffff',
                            arrowColor: '#007AFF',
                            monthTextColor: isDark ? '#ffffff' : '#000000',
                            indicatorColor: '#007AFF',
                            textDayFontFamily: 'Outfit_400Regular',
                            textMonthFontFamily: 'Outfit_700Bold',
                            textDayHeaderFontFamily: 'Outfit_600SemiBold',
                            textDayFontSize: 16,
                            textMonthFontSize: 18,
                            textDayHeaderFontSize: 13,
                        }}
                        markedDates={markedDates}
                        style={styles.calendar}
                        onDayPress={(day: { dateString: string }) => {
                            setSelectedDate(day.dateString);
                        }}
                    />
                </View>

                {/* Transactions for selected date */}
                {selectedDateTransactions.length > 0 ? (
                    <View style={styles.transactionsContainer}>
                        <View style={styles.transactionsHeader}>
                            <Text style={[styles.dateLabel, isDark && styles.dateLabelDark]}>
                                {format(parseISO(selectedDate), 'EEEE, MMM d')}
                            </Text>
                            <Text style={styles.totalLabel}>${totalForDate.toFixed(2)}</Text>
                        </View>

                        <FlatList
                            data={selectedDateTransactions}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.transactionsList}
                            renderItem={({ item }) => {
                                const isMultiItem = !!item.items;
                                const totalAmount = isMultiItem
                                    ? item.items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0)
                                    : ((item.price || 0) * (item.quantity || 0));

                                const title = isMultiItem
                                    ? `${item.items.length} Items`
                                    : item.productName;

                                const subtitle = isMultiItem
                                    ? item.items.map((i: any) => i.productName).join(', ')
                                    : `${item.category} • ${item.quantity}x`;

                                return (
                                    <TouchableOpacity
                                        onPress={() => handleTransactionPress(item)}
                                        activeOpacity={0.7}
                                        style={[styles.transactionCard, isDark && styles.transactionCardDark]}
                                    >
                                        <View style={styles.transactionMain}>
                                            <Text style={[styles.productName, isDark && styles.productNameDark]}>
                                                {title}
                                            </Text>
                                            <Text
                                                style={[styles.category, isDark && styles.categoryDark]}
                                                numberOfLines={1}
                                            >
                                                {subtitle}
                                            </Text>
                                        </View>
                                        <View style={styles.transactionDetails}>
                                            <Text style={styles.amount}>
                                                ${totalAmount.toFixed(2)}
                                            </Text>
                                            <Text style={[styles.paymentMethod, isDark && styles.paymentMethodDark]}>
                                                {item.paymentMethod.toUpperCase()}
                                                {item.tip > 0 && ` +$${item.tip.toFixed(2)}`}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>📭</Text>
                        <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                            No transactions on this date
                        </Text>
                    </View>
                )}
            </SafeAreaView>

            <EditTransactionModal
                visible={!!editingTransaction}
                transaction={editingTransaction}
                onClose={() => setEditingTransaction(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    containerDark: {
        backgroundColor: '#000000',
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 280,
        opacity: 0, // visually solid black background
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20, // increased from 8 to match Reports
        paddingBottom: 0, // moved spacing to title margin
    },
    title: {
        fontSize: 34,
        fontFamily: 'Outfit_700Bold',
        color: '#000000',
        marginBottom: 20, // added to match Reports
        letterSpacing: -0.5,
        fontWeight: '700',
    },
    titleDark: {
        color: '#ffffff',
    },
    calendarCard: {
        marginHorizontal: 20,
        backgroundColor: '#ffffff',
        borderRadius: 20, // increased from 16 to match Reports
        padding: 16, // increased from 12 to match Reports
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 20,
    },
    calendarCardDark: {
        backgroundColor: '#1c1c1e',
        shadowOpacity: 0.3,
    },
    calendar: {
        backgroundColor: 'transparent',
    },
    transactionsContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    transactionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    dateLabel: {
        fontSize: 17,
        fontFamily: 'Outfit_600SemiBold',
        color: '#000000',
        letterSpacing: -0.2,
    },
    dateLabelDark: {
        color: '#ffffff',
    },
    totalLabel: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        color: '#007AFF',
        letterSpacing: -0.5,
    },
    transactionsList: {
        paddingBottom: 120,
    },
    transactionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    transactionCardDark: {
        backgroundColor: '#1c1c1e',
    },
    transactionMain: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#000000',
        marginBottom: 4,
        letterSpacing: -0.2,
    },
    productNameDark: {
        color: '#ffffff',
    },
    category: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#8e8e93',
        textTransform: 'capitalize',
    },
    categoryDark: {
        color: '#98989d',
    },
    transactionDetails: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#007AFF',
        marginBottom: 2,
        letterSpacing: -0.3,
    },
    paymentMethod: {
        fontSize: 11,
        fontFamily: 'Outfit_600SemiBold',
        color: '#8e8e93',
        letterSpacing: 0.2,
    },
    paymentMethodDark: {
        color: '#98989d',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 80,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#8e8e93',
    },
    emptyTextDark: {
        color: '#98989d',
    },
});
