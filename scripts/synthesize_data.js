const userId = '97b3e90f-14ba-4253-abef-dd0f02ede7a5';
const startDate = new Date('2025-06-01'); // Starting 32 weeks ago from roughly now

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatTimestamp(date, hourOffset = 0) {
    const d = new Date(date);
    d.setHours(d.getHours() + hourOffset);
    return d.toISOString();
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

let sql = `-- Pulse Synthetic Data: 32-Week Performance Baseline\n`;

// Baseline Biometrics
let currentSquat = 345;
let currentBench = 245;
let currentDeadlift = 386;
let currentMile = 465; // 7:45 in seconds

for (let week = 1; week <= 32; week++) {
    let phase = 1;
    if (week >= 9 && week <= 20) phase = 2;
    if (week >= 21) phase = 3;

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDate = addDays(startDate, (week - 1) * 7 + dayOffset);
        const dayName = dayNames[currentDate.getDay()];
        const dateStr = formatDate(currentDate);

        // --- SLEEP DATA ---
        const bedTime = formatTimestamp(currentDate, -8); // 10 PM previous night
        const wakeTime = formatTimestamp(currentDate, 0); // 6 AM
        const baseSleep = 420 + (Math.random() * 120); // 7-9 hours

        sql += `INSERT INTO public.sleep_logs (user_id, date, start_time, end_time, asleep_minutes, hrv_ms, resting_hr) 
                VALUES ('${userId}', '${dateStr}', '${bedTime}', '${wakeTime}', ${Math.round(baseSleep)}, ${Math.round(45 + Math.random() * 30)}, ${Math.round(50 + Math.random() * 10)});\n`;

        // --- READINESS ---
        const readiness = Math.round(70 + Math.random() * 25);
        sql += `INSERT INTO public.readiness_logs (user_id, date, readiness_score, recovery_status) 
                VALUES ('${userId}', '${dateStr}', ${readiness}, '${readiness > 85 ? 'optimal' : 'caution'}');\n`;

        // --- WORKOUT DATA (Exclude Sunday) ---
        if (dayName !== 'Sunday') {
            sql += `INSERT INTO public.workout_sessions (id, user_id, date, phase_id, week_number, day_name) 
                    VALUES (extensions.uuid_generate_v4(), '${userId}', '${dateStr}', ${phase}, ${week}, '${dayName}');\n`;

            // Simple Logic for Load Progression
            if (phase === 1 && dayName === 'Monday') currentSquat += 2.5;
            if (phase === 1 && dayName === 'Tuesday') currentBench += 2;
            if (phase === 2 && dayName === 'Monday') currentSquat += 5;
            if (phase === 3 && week % 2 === 0) {
                currentSquat += 10;
                currentBench += 5;
            }

            // Adding a Log entry for the main lift of the day
            let liftName = "Active Movement";
            let perf = {};
            let trackingMode = 'CHECKBOX';

            if (dayName === 'Monday') {
                liftName = "Back Squat";
                perf = { sets: [{ weight: Math.round(currentSquat * 0.7), reps: 8 }, { weight: Math.round(currentSquat * 0.7), reps: 8 }, { weight: Math.round(currentSquat * 0.7), reps: 8 }] };
                trackingMode = 'STRENGTH_SETS';
            } else if (dayName === 'Tuesday') {
                liftName = "Bench Press";
                perf = { sets: [{ weight: Math.round(currentBench * 0.7), reps: 8 }, { weight: Math.round(currentBench * 0.7), reps: 8 }, { weight: Math.round(currentBench * 0.7), reps: 8 }] };
                trackingMode = 'STRENGTH_SETS';
            } else if (dayName === 'Wednesday') {
                liftName = "Zone 2 Run";
                perf = { distance: (3.5 + (week * 0.1)).toFixed(2), duration_min: 35 + week, avg_hr: 152 };
                trackingMode = 'CARDIO_BASIC';
            } else if (dayName === 'Thursday') {
                liftName = "MetCon: Flow";
                perf = { rounds: 8 + Math.floor(week / 4), reps: 15, avg_hr: 165 };
                trackingMode = 'METCON';
            }

            sql += `INSERT INTO public.logs (user_id, date, segment_name, segment_type, performance_data, phase_id, week_number, day_name, tracking_mode) 
                    VALUES ('${userId}', '${dateStr}', '${liftName}', 'MAIN_LIFT', '${JSON.stringify(perf)}', ${phase}, ${week}, '${dayName}', '${trackingMode}');\n`;
        }
    }
}

console.log(sql);
