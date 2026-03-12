export const STAGES = ["Backlog", "Ready", "In Progress", "Done"];

const URGENCY_TERMS = [
  "today",
  "tomorrow",
  "urgent",
  "deadline",
  "demo",
  "launch",
  "friday",
  "monday",
  "asap",
  "ship",
  "blocker",
  "stalled",
  "fix",
  "before"
];

const IMPACT_TERMS = [
  "user",
  "pilot",
  "beta",
  "customer",
  "team",
  "mentor",
  "onboarding",
  "activation",
  "quality",
  "retention",
  "feedback",
  "launch",
  "startup",
  "demo"
];

const HIGH_EFFORT_TERMS = [
  "integrate",
  "automation",
  "system",
  "prototype",
  "architecture",
  "research",
  "workflow",
  "stability",
  "dashboard"
];

const LOW_EFFORT_TERMS = [
  "email",
  "copy",
  "draft",
  "checklist",
  "brief",
  "summary",
  "review",
  "notes"
];

const CATEGORY_RULES = [
  { label: "Build", keywords: ["build", "ship", "launch", "fix", "prototype", "workflow", "stability"] },
  { label: "Research", keywords: ["research", "interview", "benchmark", "feedback", "investigate", "validate"] },
  { label: "Align", keywords: ["align", "meeting", "sync", "owner", "review", "mentor", "stakeholder"] },
  { label: "Growth", keywords: ["outreach", "activation", "pilot", "onboarding", "email", "user"] },
  { label: "Measure", keywords: ["metrics", "analytics", "drop-off", "snapshot", "dashboard"] }
];

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const WEEK_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" });

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function countKeywordHits(text, keywords) {
  return keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0);
}

function dedupe(items) {
  return [...new Map(items.map((item) => [item.toLowerCase(), item])).values()];
}

function cleanSegment(segment) {
  return segment
    .replace(/^[\s>*-]+/, "")
    .replace(/^\d+[\).\s-]+/, "")
    .replace(/^(goal|note|notes|problem|issue|idea|todo|action|deadline)\s*:\s*/i, "")
    .replace(/^(we need to|need to|must|should|let'?s|please|could we|can we)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceCase(text) {
  if (!text) {
    return text;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function titleFromSegment(segment) {
  const cleaned = cleanSegment(segment).replace(/[.?!]+$/, "");
  const words = cleaned.split(" ").filter(Boolean);
  const shortened = words.length > 9 ? `${words.slice(0, 9).join(" ")}...` : cleaned;
  return sentenceCase(shortened);
}

function descriptionFromSegment(segment, category) {
  const cleaned = cleanSegment(segment);
  return `${category} lane: ${sentenceCase(cleaned)}.`;
}

function detectCategory(segment) {
  const text = segment.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.label;
    }
  }

  return "Plan";
}

function scoreUrgency(segment) {
  const text = segment.toLowerCase();
  let score = 42;

  score += countKeywordHits(text, URGENCY_TERMS) * 8;

  if (/\b(blocker|stuck|broken|risk)\b/.test(text)) {
    score += 16;
  }

  if (/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday)\b/.test(text)) {
    score += 10;
  }

  if (/\b(later|wishlist|someday|nice to have)\b/.test(text)) {
    score -= 14;
  }

  return clamp(Math.round(score), 28, 99);
}

function scoreImpact(segment) {
  const text = segment.toLowerCase();
  let score = 46;

  score += countKeywordHits(text, IMPACT_TERMS) * 7;

  if (/\b(blocker|quality|retention|pilot|activation|launch|demo)\b/.test(text)) {
    score += 12;
  }

  if (/\b(notes|summary|cleanup)\b/.test(text)) {
    score -= 8;
  }

  return clamp(Math.round(score), 30, 98);
}

function scoreEffort(segment) {
  const text = segment.toLowerCase();
  const wordCount = cleanSegment(segment).split(" ").filter(Boolean).length;
  let score = 28 + wordCount * 2;

  score += countKeywordHits(text, HIGH_EFFORT_TERMS) * 9;
  score -= countKeywordHits(text, LOW_EFFORT_TERMS) * 6;

  if (/\b(without|simple|quick)\b/.test(text)) {
    score -= 8;
  }

  return clamp(Math.round(score), 20, 92);
}

function computePriority(urgency, impact, effort) {
  const priority = urgency * 0.55 + impact * 0.45 - effort * 0.15;
  return clamp(Math.round(priority), 20, 99);
}

function priorityBand(priority) {
  if (priority >= 76) {
    return "Now";
  }

  if (priority >= 58) {
    return "Next";
  }

  return "Later";
}

function timeboxLabel(effort) {
  if (effort >= 78) {
    return "Full day";
  }

  if (effort >= 60) {
    return "Half day";
  }

  if (effort >= 42) {
    return "90 min";
  }

  return "45 min";
}

function defaultStage(index) {
  if (index <= 1) {
    return "In Progress";
  }

  if (index <= 4) {
    return "Ready";
  }

  return "Backlog";
}

function preferredDayIndexes(task) {
  const text = task.source.toLowerCase();

  if (/\b(review|share|demo|walkthrough|mentor|present)\b/.test(text)) {
    return [3, 4, 2, 1, 0];
  }

  if (task.urgency >= 86) {
    return [0, 1, 2, 3, 4];
  }

  if (task.effort >= 72) {
    return [1, 2, 3, 0, 4];
  }

  if (task.category === "Align") {
    return [0, 2, 3, 1, 4];
  }

  return [1, 0, 2, 3, 4];
}

function chooseWeekday(task, week, dayLoads) {
  const indexes = preferredDayIndexes(task);

  return indexes
    .map((index) => week[index])
    .sort((left, right) => {
      const leftLoad = dayLoads.get(left.key) ?? 0;
      const rightLoad = dayLoads.get(right.key) ?? 0;
      return leftLoad - rightLoad;
    })[0];
}

function createTask(segment, index) {
  const category = detectCategory(segment);
  const urgency = scoreUrgency(segment);
  const impact = scoreImpact(segment);
  const effort = scoreEffort(segment);
  const priority = computePriority(urgency, impact, effort);

  return {
    id: `task-${index + 1}`,
    title: titleFromSegment(segment),
    description: descriptionFromSegment(segment, category),
    category,
    urgency,
    impact,
    effort,
    priority,
    priorityBand: priorityBand(priority),
    timebox: timeboxLabel(effort),
    source: cleanSegment(segment),
    stage: "Backlog",
    dueDay: "",
    dueLabel: ""
  };
}

export function extractSegments(rawText) {
  const lines = rawText
    .split(/\n+/)
    .flatMap((line) => line.split(/[.;](?=\s+[A-Z]|\s*$)/))
    .map(cleanSegment)
    .filter((segment) => segment.length >= 12);

  return dedupe(lines);
}

export function getWorkweek(baseDate = new Date()) {
  const monday = new Date(baseDate);
  monday.setHours(0, 0, 0, 0);

  const day = monday.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + delta);

  return Array.from({ length: 5 }, (_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    const key = current.toISOString().slice(0, 10);

    return {
      key,
      label: WEEKDAY_FORMATTER.format(current),
      dateLabel: DATE_FORMATTER.format(current)
    };
  });
}

export function groupTasksByStage(tasks) {
  return STAGES.map((stage) => ({
    stage,
    tasks: sortTasksForDisplay(tasks.filter((task) => task.stage === stage))
  }));
}

export function groupTasksByDay(tasks, week) {
  return week.map((day) => ({
    ...day,
    tasks: sortTasksForDisplay(tasks.filter((task) => task.dueDay === day.key))
  }));
}

export function sortTasksForDisplay(tasks) {
  return [...tasks].sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }

    return right.urgency - left.urgency;
  });
}

export function createInsights(tasks, objective, weekLabel) {
  const sorted = sortTasksForDisplay(tasks);
  const topTask = sorted[0];
  const quickWins = sorted.filter((task) => task.effort <= 44).slice(0, 2);
  const riskTask =
    sorted.find((task) => task.urgency >= 82 && task.effort >= 66) ??
    sorted.find((task) => task.priorityBand === "Now");

  const categoryTotals = new Map();
  for (const task of sorted.slice(0, 5)) {
    categoryTotals.set(task.category, (categoryTotals.get(task.category) ?? 0) + 1);
  }

  const focusCategory =
    [...categoryTotals.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "Plan";

  return {
    headline: objective,
    focus: `${focusCategory} is carrying the sprint this week.`,
    quickWins:
      quickWins.length > 0
        ? quickWins.map((task) => task.title)
        : ["Capture one easy win to build momentum early."],
    risk: riskTask
      ? `${riskTask.title} has the highest delivery tension. De-risk it by ${weekLabel.split(" - ")[0]}.`
      : "No major delivery risk detected yet.",
    rhythm:
      topTask && topTask.urgency >= 84
        ? "Front-load blockers on Monday and Tuesday, then reserve Thursday for review and polish."
        : "Use Monday to align, midweek for deep work, and Friday for demo polish and recap."
  };
}

export function generateSprintPlan(
  rawText,
  { objective = "Turn messy notes into a focused sprint", baseDate = new Date(), maxTasks = 9 } = {}
) {
  const segments = extractSegments(rawText);
  const effectiveSegments =
    segments.length > 0 ? segments : [`Clarify the next sprint around ${objective.toLowerCase()}`];

  const week = getWorkweek(baseDate);
  const weekLabel = `${WEEK_LABEL_FORMATTER.format(new Date(week[0].key))} - ${WEEK_LABEL_FORMATTER.format(
    new Date(week[week.length - 1].key)
  )}`;

  const rankedTasks = effectiveSegments
    .slice(0, maxTasks)
    .map((segment, index) => createTask(segment, index))
    .sort((left, right) => right.priority - left.priority)
    .map((task, index) => ({ ...task, stage: defaultStage(index) }));

  const dayLoads = new Map(week.map((day) => [day.key, 0]));
  const tasks = rankedTasks.map((task) => {
    const selectedDay = chooseWeekday(task, week, dayLoads);
    dayLoads.set(selectedDay.key, (dayLoads.get(selectedDay.key) ?? 0) + Math.max(1, task.effort / 35));

    return {
      ...task,
      dueDay: selectedDay.key,
      dueLabel: `${selectedDay.label} ${selectedDay.dateLabel}`
    };
  });

  return {
    tasks,
    week,
    weekLabel,
    summary: createInsights(tasks, objective, weekLabel),
    generatedAt: new Date(baseDate).toISOString()
  };
}
