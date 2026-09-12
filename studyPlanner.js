export function generateStudyPlan(data) {
  const { name, course, subjects, examDate, dailyHours, strongSubjects, weakSubjects } = data;

  const subjectList = subjects
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const strongList = (strongSubjects || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const weakList = (weakSubjects || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  const daysUntilExam = Math.max(1, Math.round((exam - today) / (1000 * 60 * 60 * 24)));

  const classified = subjectList.map((subject) => {
    const lower = subject.toLowerCase();
    let priority = 'normal';
    let weight = 1;

    if (weakList.some((w) => lower.includes(w) || w.includes(lower))) {
      priority = 'weak';
      weight = 2;
    } else if (strongList.some((s) => lower.includes(s) || s.includes(lower))) {
      priority = 'strong';
      weight = 0.7;
    }

    return { name: subject, priority, weight };
  });

  const totalWeight = classified.reduce((sum, s) => sum + s.weight, 0);

  const subjectPlan = classified.map((s) => ({
    name: s.name,
    priority: s.priority,
    hoursPerDay: Math.max(0.5, Math.round((s.weight / totalWeight) * dailyHours * 2) / 2),
    percentage: Math.round((s.weight / totalWeight) * 100),
    totalHours: Math.round((s.weight / totalWeight) * dailyHours * daysUntilExam * 2) / 2,
    days: daysUntilExam,
  }));

  const schedule = buildDailySchedule(subjectPlan, dailyHours);

  const tips = generateTips({
    name,
    daysUntilExam,
    dailyHours,
    weakCount: weakList.length,
    strongCount: strongList.length,
    subjectCount: subjectList.length,
  });

  return {
    name,
    course,
    daysUntilExam,
    dailyHours,
    subjectCount: subjectList.length,
    subjectPlan,
    schedule,
    tips,
  };
}

function buildDailySchedule(subjectPlan, dailyHours) {
  const sorted = [...subjectPlan].sort((a, b) => {
    const order = { weak: 0, normal: 1, strong: 2 };
    return order[a.priority] - order[b.priority];
  });

  const slots = [];
  let remaining = dailyHours;
  let startTime = 16;

  for (const subject of sorted) {
    if (remaining <= 0) break;
    const slotHours = Math.min(subject.hoursPerDay, remaining);
    if (slotHours <= 0) continue;

    const startHour = Math.floor(startTime);
    const startMin = Math.round((startTime - startHour) * 60);
    const endTime = startTime + slotHours;
    const endHour = Math.floor(endTime);
    const endMin = Math.round((endTime - endHour) * 60);

    const formatTime = (h, m) => {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
    };

    let activity;
    if (subject.priority === 'weak') {
      activity = 'Deep focus — practice problems & review';
    } else if (subject.priority === 'strong') {
      activity = 'Quick review & flashcards';
    } else {
      activity = 'Study new material & take notes';
    }

    slots.push({
      subject: subject.name,
      time: `${formatTime(startHour, startMin)} — ${formatTime(endHour, endMin)}`,
      activity,
      priority: subject.priority,
    });

    startTime = endTime + 0.5;
    remaining -= slotHours;
  }

  return slots;
}

function generateTips({ name, daysUntilExam, dailyHours, weakCount, strongCount, subjectCount }) {
  const tips = [];

  if (daysUntilExam <= 7) {
    tips.push(`${name}, exams are very close — prioritize solving past papers and timed mock tests.`);
  } else if (daysUntilExam <= 30) {
    tips.push(`You have ${daysUntilExam} days left. Start with your weak subjects first while you still have time to improve.`);
  } else {
    tips.push(`You have plenty of time (${daysUntilExam} days). Build a consistent daily routine and stick to it.`);
  }

  if (dailyHours >= 6) {
    tips.push(`You are planning ${dailyHours} hours/day — remember to take a 10-minute break every 50 minutes to avoid burnout.`);
  } else if (dailyHours < 3) {
    tips.push(`${dailyHours} hours/day is on the lighter side. Try to find small extra windows — even 30 minutes of revision adds up.`);
  }

  if (weakCount > 0) {
    tips.push(`Spend the first part of each session on your ${weakCount} weak subject(s) when your mind is freshest.`);
  }

  if (strongCount > 0 && subjectCount > strongCount) {
    tips.push(`Do not neglect your strong subjects — quick daily reviews keep them sharp and protect easy marks.`);
  }

  tips.push("Use active recall and spaced repetition instead of just re-reading notes — it is proven to be far more effective.");

  if (subjectCount > 5) {
    tips.push(`With ${subjectCount} subjects, rotate them across the week so nothing goes untouched for more than 2 days.`);
  }

  return tips;
}
