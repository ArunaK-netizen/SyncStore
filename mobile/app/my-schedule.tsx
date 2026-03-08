import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatShiftTime, getWeekDates, useSchedule } from '../hooks/useSchedule';
import { useTheme } from '../hooks/useTheme';

const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function calcDuration(start: string, end: string): string {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) return '';
    const h = Math.floor(mins / 60), m = mins % 60;
    return m > 0 ? `${h} h ${m} m` : `${h} h`;
}

export default function MySchedulePage() {
    const router = useRouter();
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';
    const { schedules, loading } = useSchedule();
    const [weekOffset, setWeekOffset] = useState(0);
    const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
    const today = new Date().toISOString().split('T')[0];

    const weekLabel = useMemo(() => {
        const start = new Date(weekDates[0] + 'T00:00:00');
        const end = new Date(weekDates[6] + 'T00:00:00');
        if (start.getMonth() === end.getMonth()) {
            return `${MONTHS[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
        }
        return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}`;
    }, [weekDates]);

    const weekShifts = schedules.filter(s => weekDates.includes(s.date));
    const totalMins = weekShifts.reduce((sum, s) => {
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        return sum + Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
    }, 0);
    const totalHours = totalMins > 0
        ? (totalMins % 60 > 0 ? `${Math.floor(totalMins / 60)} h ${totalMins % 60} m` : `${Math.floor(totalMins / 60)} h`)
        : '0 h';

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={22} color="#0A84FF" />
                        <Text style={styles.backText}>Profile</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>My Schedule</Text>
                    <View style={{ width: 80 }} />
                </View>

                {/* Week navigation */}
                <View style={styles.weekNav}>
                    <TouchableOpacity
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWeekOffset(w => w - 1); }}
                        style={[styles.navBtn, isDark && styles.navBtnDark]}
                    >
                        <Ionicons name="chevron-back" size={18} color={isDark ? '#0A84FF' : '#007AFF'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setWeekOffset(0)} style={styles.weekLabelWrap}>
                        <Text style={[styles.weekLabel, isDark && styles.weekLabelDark]}>{weekLabel}</Text>
                        {weekOffset !== 0 && <Text style={styles.thisTap}>tap for today</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWeekOffset(w => w + 1); }}
                        style={[styles.navBtn, isDark && styles.navBtnDark]}
                    >
                        <Ionicons name="chevron-forward" size={18} color={isDark ? '#0A84FF' : '#007AFF'} />
                    </TouchableOpacity>
                </View>

                {/* Week summary pills */}
                <View style={styles.summaryRow}>
                    <View style={[styles.pill, isDark && styles.pillDark]}>
                        <Ionicons name="time-outline" size={14} color="#0A84FF" />
                        <Text style={styles.pillText}>{weekShifts.length} shift{weekShifts.length !== 1 ? 's' : ''}</Text>
                    </View>
                    <View style={[styles.pill, isDark && styles.pillDark, { borderColor: '#30D158' }]}>
                        <Ionicons name="hourglass-outline" size={14} color="#30D158" />
                        <Text style={[styles.pillText, { color: '#30D158' }]}>{totalHours} working</Text>
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator color="#0A84FF" style={{ marginTop: 40 }} />
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
                        {weekDates.map((date, i) => {
                            const dayShifts = schedules.filter(s => s.date === date);
                            const isToday = date === today;
                            const isPast = date < today;
                            const d = new Date(date + 'T00:00:00');

                            return (
                                <View key={date} style={[styles.dayBlock, isDark && styles.dayBlockDark, isToday && styles.dayBlockToday]}>
                                    {/* Day header */}
                                    <View style={styles.dayHeader}>
                                        <View style={[styles.dayCircle, isToday && styles.dayCircleToday, isPast && !isToday && styles.dayCirclePast]}>
                                            <Text style={[styles.dayCircleNum, isToday && styles.dayCircleNumToday, isPast && !isToday && styles.dayCircleNumPast]}>
                                                {d.getDate()}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={[styles.dayFullName, isDark && styles.dayFullNameDark, isPast && !isToday && styles.fadedText, isToday && styles.todayLabel]}>
                                                {DAYS_FULL[i]}{isToday ? '  · Today' : ''}
                                            </Text>
                                            <Text style={[styles.dayDate, isDark && styles.dayDateDark, isPast && !isToday && styles.fadedText]}>
                                                {MONTHS[d.getMonth()]} {d.getFullYear()}
                                            </Text>
                                        </View>
                                        {dayShifts.length === 0 && (
                                            <View style={styles.offChip}>
                                                <Text style={styles.offChipText}>Day off</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Shifts */}
                                    {dayShifts.map(s => (
                                        <View key={s.id} style={[styles.shiftCard, isDark && styles.shiftCardDark, isToday && styles.shiftCardToday]}>
                                            <View style={[styles.shiftAccent, isToday && styles.shiftAccentToday]} />
                                            <View style={styles.shiftDetails}>
                                                <View style={styles.shiftTimeRow}>
                                                    <Text style={[styles.shiftTime, isDark && styles.shiftTimeDark]}>
                                                        {formatShiftTime(s.startTime)}  →  {formatShiftTime(s.endTime)}
                                                    </Text>
                                                    <View style={[styles.durationChip, isToday && styles.durationChipToday]}>
                                                        <Text style={[styles.durationText, isToday && styles.durationTextToday]}>
                                                            {calcDuration(s.startTime, s.endTime)}
                                                        </Text>
                                                    </View>
                                                </View>
                                                {s.note ? (
                                                    <View style={styles.noteRow}>
                                                        <Ionicons name="information-circle-outline" size={13} color="#8e8e93" />
                                                        <Text style={styles.noteText}>{s.note}</Text>
                                                    </View>
                                                ) : null}
                                                <Text style={styles.addedBy}>Added by {s.createdBy}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            );
                        })}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f7' },
    containerDark: { backgroundColor: '#000' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 80 },
    backText: { fontSize: 16, fontFamily: 'Outfit_600SemiBold', color: '#0A84FF' },
    headerTitle: { fontSize: 17, fontFamily: 'Outfit_700Bold', color: '#000' },
    headerTitleDark: { color: '#fff' },

    weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
    navBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#e5e5ea', alignItems: 'center', justifyContent: 'center' },
    navBtnDark: { backgroundColor: '#2c2c2e' },
    weekLabelWrap: { alignItems: 'center' },
    weekLabel: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: '#000' },
    weekLabelDark: { color: '#fff' },
    thisTap: { fontSize: 10, fontFamily: 'Outfit_400Regular', color: '#8e8e93', marginTop: 2 },

    summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
    pill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderWidth: 1, borderColor: '#0A84FF',
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    },
    pillDark: {},
    pillText: { fontSize: 13, fontFamily: 'Outfit_600SemiBold', color: '#0A84FF' },

    listContent: { paddingHorizontal: 16, gap: 12 },

    dayBlock: {
        backgroundColor: '#fff', borderRadius: 16,
        padding: 16, shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    dayBlockDark: { backgroundColor: '#1c1c1e' },
    dayBlockToday: { borderWidth: 1.5, borderColor: '#0A84FF' },

    dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    dayCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e5ea', alignItems: 'center', justifyContent: 'center' },
    dayCircleToday: { backgroundColor: '#0A84FF' },
    dayCirclePast: { backgroundColor: '#f2f2f7' },
    dayCircleNum: { fontSize: 17, fontFamily: 'Outfit_700Bold', color: '#000' },
    dayCircleNumToday: { color: '#fff' },
    dayCircleNumPast: { color: '#c7c7cc' },
    dayFullName: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: '#000' },
    dayFullNameDark: { color: '#fff' },
    todayLabel: { color: '#0A84FF' },
    dayDate: { fontSize: 12, fontFamily: 'Outfit_400Regular', color: '#8e8e93' },
    dayDateDark: { color: '#636366' },
    fadedText: { color: '#c7c7cc' },
    offChip: { marginLeft: 'auto' as any, backgroundColor: '#f2f2f7', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
    offChipText: { fontSize: 12, fontFamily: 'Outfit_400Regular', color: '#8e8e93' },

    shiftCard: {
        flexDirection: 'row', backgroundColor: '#f2f2f7',
        borderRadius: 12, overflow: 'hidden', marginTop: 6,
    },
    shiftCardDark: { backgroundColor: '#2c2c2e' },
    shiftCardToday: { backgroundColor: 'rgba(10,132,255,0.08)' },
    shiftAccent: { width: 4, backgroundColor: '#0A84FF' },
    shiftAccentToday: { backgroundColor: '#30D158' },
    shiftDetails: { flex: 1, padding: 12 },
    shiftTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    shiftTime: { fontSize: 15, fontFamily: 'Outfit_700Bold', color: '#000' },
    shiftTimeDark: { color: '#fff' },
    durationChip: { backgroundColor: 'rgba(10,132,255,0.12)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    durationChipToday: { backgroundColor: 'rgba(48,209,88,0.15)' },
    durationText: { fontSize: 12, fontFamily: 'Outfit_600SemiBold', color: '#0A84FF' },
    durationTextToday: { color: '#30D158' },
    noteRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
    noteText: { fontSize: 13, fontFamily: 'Outfit_400Regular', color: '#8e8e93' },
    addedBy: { fontSize: 11, fontFamily: 'Outfit_400Regular', color: '#c7c7cc' },
});
