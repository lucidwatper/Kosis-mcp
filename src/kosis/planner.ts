import { inferQuestionIntent } from "./intent.js";
import { buildQueryPlan, type QueryPlanLane } from "./relevance.js";
import type {
  PlannedDatasetCandidate,
  PlannerComparisonAxis,
  PlannerDatasetLane,
  PlannerDatasetRequirement,
  PlannerIndicatorCandidate,
  PlannerPeriodPlan,
  QueryIntent,
  QuestionPlan,
} from "./types.js";
import { orderedTokenizeQuestion, tokenizeQuestion, uniqueStrings } from "./utils.js";

interface DomainFamilyRule {
  patterns: string[];
  candidates: string[];
}

const GENERIC_CANDIDATE_TOKENS = new Set([
  "비교",
  "대비",
  "추이",
  "변화",
  "변화율",
  "증감",
  "증감률",
  "설명",
  "의미",
  "수치",
  "값",
  "자료",
  "통계",
  "통계표",
  "지표",
  "최근",
  "지난",
  "대한민국",
  "한국",
  "국내",
  "전국",
  "정리",
  "정리해서",
  "표",
  "표로",
]);

const ENTITY_PHRASE_NOISE_TOKENS = new Set([
  ...GENERIC_CANDIDATE_TOKENS,
  "현황",
]);
const COMPOUND_HEAD_TERMS = [
  "연금",
  "보험",
  "기금",
  "급여",
  "수당",
  "소득",
  "지출",
  "가입",
  "수급",
  "복지",
  "기여금",
  "물가",
  "주택",
  "임금",
  "인구",
  "세",
];
const LOW_SPECIFICITY_LABELS = new Set([
  "건수",
  "금액",
  "지출",
  "소득",
  "인구",
  "현황",
]);

const DOMAIN_FAMILY_RULES: DomainFamilyRule[] = [
  {
    patterns: ["고용", "고용률", "취업", "취업자"],
    candidates: ["고용률", "취업자", "실업률"],
  },
  {
    patterns: ["실업", "실업률", "실업자"],
    candidates: ["실업률", "실업자", "고용률"],
  },
  {
    patterns: ["혼인", "조혼인율"],
    candidates: ["혼인 건수", "조혼인율"],
  },
  {
    patterns: ["이혼", "조이혼율"],
    candidates: ["이혼 건수", "조이혼율"],
  },
  {
    patterns: ["출생", "출생아", "조출생률"],
    candidates: ["출생아 수", "조출생률"],
  },
  {
    patterns: ["사망", "사망자", "조사망률"],
    candidates: ["사망자 수", "조사망률"],
  },
  {
    patterns: ["임금", "급여", "소득"],
    candidates: ["평균임금", "월평균임금", "근로소득"],
  },
  {
    patterns: ["물가", "소비자물가"],
    candidates: ["소비자물가지수", "물가상승률"],
  },
  {
    patterns: ["인구"],
    candidates: ["총인구", "인구수", "인구 증가율"],
  },
  {
    patterns: ["신용카드", "카드"],
    candidates: ["신용카드 이용건수", "신용카드 이용금액"],
  },
];

const PERIOD_LABELS: Record<NonNullable<QueryIntent["preferredPrdSe"]>, string> = {
  Y: "연도",
  M: "월",
  Q: "분기",
  S: "반기",
  W: "주",
  D: "일",
};

const TRAILING_PARTICLES = [
  "으로",
  "에서",
  "에게",
  "까지",
  "부터",
  "처럼",
  "보다",
  "과",
  "와",
  "은",
  "는",
  "이",
  "가",
  "을",
  "를",
  "의",
  "로",
  "도",
  "만",
  "에",
];

function normalizeCandidateLabel(label: string | undefined): string | undefined {
  if (!label) {
    return undefined;
  }

  const tokens = label
    .toLowerCase()
    .split(/[\s,./?!:;()[\]{}|"'`~\-_=+]+/)
    .map((token) => token.trim())
    .map((token) => {
      let normalized = token;
      for (const particle of TRAILING_PARTICLES) {
        if (normalized.length > particle.length + 1 && normalized.endsWith(particle)) {
          normalized = normalized.slice(0, -particle.length);
          break;
        }
      }
      return normalized;
    })
    .filter((token) => token.length > 0 && !GENERIC_CANDIDATE_TOKENS.has(token));

  if (tokens.length === 0) {
    return undefined;
  }

  return uniqueStrings(tokens).join(" ");
}

function expandFamilyCandidates(label: string): string[] {
  const normalized = normalizeCandidateLabel(label) ?? label;
  const tokens = tokenizeQuestion(normalized);

  return uniqueStrings(
    DOMAIN_FAMILY_RULES.flatMap((rule) =>
      rule.patterns.some(
        (pattern) => normalized.includes(pattern) || tokens.includes(pattern),
      )
        ? rule.candidates
        : [],
    ),
  );
}

function extractEntityPhraseCandidates(question: string): string[] {
  const tokens = orderedTokenizeQuestion(question).filter(
    (token) => !ENTITY_PHRASE_NOISE_TOKENS.has(token),
  );
  const phrases: string[] = [];

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const pair = [tokens[index], tokens[index + 1]];
    if (pair.some((token) => token.length < 2)) {
      continue;
    }

    phrases.push(pair.join(" "));
    if (COMPOUND_HEAD_TERMS.includes(pair[1])) {
      phrases.push(pair.join(""));
    }

    if (index < tokens.length - 2) {
      const triple = [tokens[index], tokens[index + 1], tokens[index + 2]];
      if (triple.some((token) => token.length < 2)) {
        continue;
      }
      phrases.push(triple.join(" "));
    }
  }

  return uniqueStrings(phrases).filter((phrase) => phrase.length >= 4);
}

function sanitizeCompareTargetLabel(question: string, label: string | undefined): string | undefined {
  const normalized = normalizeCandidateLabel(label);
  if (!normalized) {
    return undefined;
  }

  let value = normalized;
  if (!question.includes("이용")) {
    value = value.replace(/\b이용건수\b/g, "건수");
    value = value.replace(/\b이용금액\b/g, "금액");
  }

  return value;
}

function buildIndicatorCandidates(
  question: string,
  intent: QueryIntent,
  extraSearchHints: string[],
): PlannerIndicatorCandidate[] {
  const entries: PlannerIndicatorCandidate[] = [];
  const seen = new Set<string>();
  const entityPhraseCandidates = extractEntityPhraseCandidates(question);

  const pushCandidate = (
    label: string | undefined,
    source: PlannerIndicatorCandidate["source"],
    searchHints: string[],
  ) => {
    const normalized =
      source === "compare-target"
        ? sanitizeCompareTargetLabel(question, label)
        : normalizeCandidateLabel(label);
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    entries.push({
      label: normalized,
      source,
      priority: entries.length + 1,
      searchHints: uniqueStrings([normalized, ...searchHints]),
    });
  };

  for (const target of intent.targets) {
    pushCandidate(target.label, "compare-target", [
      ...target.keywords,
      ...target.regionTerms,
      ...target.sexTerms,
      ...target.ageTerms,
    ]);
  }

  for (const phrase of uniqueStrings([
    ...entityPhraseCandidates,
    ...extraSearchHints,
  ])) {
    pushCandidate(phrase, "focus-term", [phrase, ...expandFamilyCandidates(phrase)]);
  }

  for (const measure of intent.measures) {
    pushCandidate(measure, "measure", [measure, ...expandFamilyCandidates(measure)]);
  }

  for (const focusTerm of intent.focusTerms) {
    pushCandidate(focusTerm, "focus-term", [focusTerm]);
  }

  for (const seed of uniqueStrings([
    ...intent.measures,
    ...intent.focusTerms,
    ...intent.keywords,
    ...extraSearchHints,
    question,
  ])) {
    for (const familyCandidate of expandFamilyCandidates(seed)) {
      pushCandidate(familyCandidate, "domain-family", [seed, familyCandidate]);
    }
  }

  if (entries.length === 0) {
    pushCandidate(question, "focus-term", [question]);
  }

  const specificLabels = new Set(
    entries
      .map((entry) => entry.label)
      .filter((label) => label.includes(" ") || label.length >= 4)
      .map((label) => label.replace(/\s+/g, "")),
  );

  const filtered = entries.filter((entry) => {
    const compact = entry.label.replace(/\s+/g, "");
    if (entry.source === "measure") {
      return true;
    }
    if (entry.label.includes(" ") || entry.label.length >= 4) {
      return true;
    }
    return ![...specificLabels].some(
      (candidate) => candidate !== compact && candidate.includes(compact),
    );
  });

  const sourceWeight: Record<PlannerIndicatorCandidate["source"], number> = {
    "compare-target": 40,
    measure: 24,
    "focus-term": 18,
    "domain-family": 12,
  };

  return filtered
    .map((entry) => {
      const compact = entry.label.replace(/\s+/g, "");
      const tokens = entry.label.split(/\s+/).filter(Boolean);
      let score = sourceWeight[entry.source];

      score += Math.min(compact.length, 8) * 3;
      if (tokens.length >= 2) {
        score += 10;
      }
      if (COMPOUND_HEAD_TERMS.some((head) => compact.endsWith(head))) {
        score += 14;
      }
      if (LOW_SPECIFICITY_LABELS.has(entry.label)) {
        score -= 20;
      }
      if (extraSearchHints.some((hint) => hint.replace(/\s+/g, "") === compact)) {
        score += 18;
      }

      return { entry, score };
    })
    .sort((left, right) => right.score - left.score || left.entry.priority - right.entry.priority)
    .map(({ entry }, index) => ({
      ...entry,
      priority: index + 1,
    }));
}

function preferredCompareLabels(
  question: string,
  intent: QueryIntent,
  indicatorCandidates: PlannerIndicatorCandidate[],
): string[] {
  const preferred = uniqueStrings(
    intent.targets.flatMap((target) => {
      const normalized = sanitizeCompareTargetLabel(question, target.label);
      if (!normalized) {
        return [];
      }
      const expanded = expandFamilyCandidates(normalized);
      return expanded.length > 0 ? [expanded[0], normalized] : [normalized];
    }),
  );

  if (preferred.length >= 2) {
    return preferred;
  }

  return indicatorCandidates.map((candidate) => candidate.label);
}

function buildPeriodPlan(intent: QueryIntent): PlannerPeriodPlan {
  let label = "최신 기준";

  if (intent.startPrdDe || intent.endPrdDe) {
    label = `${intent.startPrdDe ?? "시작 미지정"}~${intent.endPrdDe ?? "최신"}`;
  } else if (intent.recentPeriods && intent.preferredPrdSe) {
    label = `최근 ${intent.recentPeriods}${PERIOD_LABELS[intent.preferredPrdSe]}`;
  } else if (intent.preferredPrdSe) {
    label = `${PERIOD_LABELS[intent.preferredPrdSe]} 기준`;
  }

  return {
    preferredPrdSe: intent.preferredPrdSe,
    startPrdDe: intent.startPrdDe,
    endPrdDe: intent.endPrdDe,
    recentPeriods: intent.recentPeriods,
    label,
    requiresTimeSeries: intent.requiresTimeSeries,
  };
}

function axisValues(intent: QueryIntent, axis: PlannerComparisonAxis["axis"]): string[] {
  switch (axis) {
    case "indicator":
      return uniqueStrings(intent.targets.map((target) => normalizeCandidateLabel(target.label))).filter(Boolean);
    case "sex":
      if (intent.sexSelection) {
        return [intent.sexSelection];
      }
      return intent.comparisonAxes.includes("sex") ? ["남자", "여자"] : [];
    case "age":
      return intent.ageSelection ? [intent.ageSelection] : intent.comparisonAxes.includes("age") ? ["연령별"] : [];
    case "region":
      if (intent.geographyScope === "national") {
        return ["전국"];
      }
      return intent.comparisonAxes.includes("region") ? ["지역별"] : [];
    case "time":
      return intent.requiresTimeSeries || intent.preferredPrdSe ? [buildPeriodPlan(intent).label] : [];
  }
}

function buildComparisonAxes(
  intent: QueryIntent,
  indicatorCandidates: PlannerIndicatorCandidate[],
  question: string,
): PlannerComparisonAxis[] {
  const axes: PlannerComparisonAxis[] = [];

  if (intent.primaryIntent === "compare" && indicatorCandidates.length >= 2) {
    axes.push({
      axis: "indicator",
      values: preferredCompareLabels(question, intent, indicatorCandidates).slice(0, 3),
      required: true,
      reason: "비교 질문이라 비교 대상 지표 축이 필수입니다.",
    });
  }

  for (const axis of intent.comparisonAxes) {
    axes.push({
      axis,
      values: axisValues(intent, axis),
      required: true,
      reason:
        axis === "sex"
          ? "질문에 성별 비교 신호가 있습니다."
          : axis === "age"
            ? "질문에 연령 비교 신호가 있습니다."
            : "질문에 지역 비교 신호가 있습니다.",
    });
  }

  if (intent.requiresTimeSeries || intent.preferredPrdSe) {
    axes.push({
      axis: "time",
      values: axisValues(intent, "time"),
      required: intent.primaryIntent === "trend" || intent.primaryIntent === "compare",
      reason: "질문이 기간 비교나 시계열 해석을 요구합니다.",
    });
  }

  return axes;
}

function datasetSeedQuestion(
  label: string,
  lane: PlannerDatasetLane,
  intent: QueryIntent,
): string {
  if (lane === "indicator-search") {
    if (intent.primaryIntent === "explain") {
      return `${label} 설명`;
    }
    if (intent.primaryIntent === "value") {
      return `${label} 수치`;
    }
    if (intent.requiresTimeSeries) {
      return `${label} 추이`;
    }
    return label;
  }

  if (lane === "catalog-browse") {
    if (label.includes("자료") || label.includes("통계")) {
      return label;
    }
    return `${label} 자료`;
  }

  return label;
}

function laneToQueryPlanLane(lane: PlannerDatasetLane): QueryPlanLane {
  switch (lane) {
    case "indicator-search":
      return "indicator";
    case "catalog-browse":
      return "catalog";
    default:
      return "table";
  }
}

function buildGoal(intent: QueryIntent, indicatorCandidates: PlannerIndicatorCandidate[]): string {
  const lead = indicatorCandidates[0]?.label;

  switch (intent.primaryIntent) {
    case "compare":
      return lead
        ? `${lead} 중심으로 비교 가능한 표를 확보합니다.`
        : "비교 가능한 표를 확보합니다.";
    case "explain":
      return lead
        ? `${lead} 설명과 연결 수치를 확보합니다.`
        : "설명 가능한 지표와 연결 수치를 확보합니다.";
    case "browse":
      return "주제/기관/지역 기준으로 후속 탐색 가능한 KOSIS 경로를 찾습니다.";
    case "trend":
      return lead
        ? `${lead} 시계열과 비교 가능한 표를 확보합니다.`
        : "시계열과 비교 가능한 표를 확보합니다.";
    case "value":
      return lead
        ? `${lead}의 값과 표 근거를 확보합니다.`
        : "값과 표 근거를 확보합니다.";
    default:
      return lead
        ? `${lead} 관련 KOSIS 표와 지표 후보를 확보합니다.`
        : "질문을 KOSIS 질의 후보로 바꿉니다.";
  }
}

function buildDatasetCandidates(
  question: string,
  intent: QueryIntent,
  indicatorCandidates: PlannerIndicatorCandidate[],
  extraSearchHints: string[],
): PlannedDatasetCandidate[] {
  const datasets: PlannedDatasetCandidate[] = [];
  const seen = new Set<string>();
  const period = buildPeriodPlan(intent);
  const sharedEntityHints = uniqueStrings([
    ...indicatorCandidates
      .map((candidate) => candidate.label)
      .filter(
        (label) =>
          label.length >= 4 &&
          !label.includes(" ") &&
          COMPOUND_HEAD_TERMS.some((head) => label.endsWith(head)),
      ),
    ...indicatorCandidates
      .map((candidate) => candidate.label)
      .filter((label) => label.length >= 4 && label.includes(" ")),
  ]).slice(0, 3);

  const pushDataset = (
    lane: PlannerDatasetLane,
    requirement: PlannerDatasetRequirement,
    label: string,
    reason: string,
  ) => {
    const normalizedLabel = normalizeCandidateLabel(label) ?? label.trim();
    const seedQuestion = datasetSeedQuestion(normalizedLabel, lane, intent);
    const datasetKey = `${lane}:${normalizedLabel}:${seedQuestion}`;
    if (!normalizedLabel || seen.has(datasetKey)) {
      return;
    }

    seen.add(datasetKey);
    const searchHints = uniqueStrings([
      normalizedLabel,
      ...sharedEntityHints,
      ...extraSearchHints,
      ...expandFamilyCandidates(normalizedLabel),
    ]);
    const { queryPlan } = buildQueryPlan(
      seedQuestion,
      searchHints,
      intent,
      laneToQueryPlanLane(lane),
    );

    datasets.push({
      datasetId: `dataset-${datasets.length + 1}`,
      lane,
      requirement,
      label: normalizedLabel,
      seedQuestion,
      reason,
      searchHints,
      queries: queryPlan,
    });
  };

  const primaryLabels = indicatorCandidates.map((candidate) => candidate.label);
  const compareLabels =
    intent.primaryIntent === "compare"
      ? uniqueStrings([
          ...preferredCompareLabels(question, intent, indicatorCandidates),
          ...primaryLabels,
        ]).filter(Boolean)
      : [];

  switch (intent.primaryIntent) {
    case "compare":
      for (const label of compareLabels.slice(0, 3)) {
        pushDataset("table-search", "required", label, "비교 대상별 표를 직접 찾습니다.");
      }
      if (compareLabels.length >= 2) {
        pushDataset(
          "table-search",
          "optional",
          compareLabels.slice(0, 2).join(" "),
          "개별 대상 표가 약하면 묶음 질의로 한 번 더 탐색합니다.",
        );
      }
      for (const label of primaryLabels.slice(0, 2)) {
        pushDataset(
          "indicator-search",
          "optional",
          label,
          "표가 약할 때 정의/수치 지표로 비교 축을 보강합니다.",
        );
      }
      break;
    case "explain":
      for (const label of primaryLabels.slice(0, 2)) {
        pushDataset("indicator-search", "required", label, "설명형 질문이라 지표 정의가 1순위입니다.");
      }
      if (primaryLabels[0]) {
        pushDataset("table-search", "optional", primaryLabels[0], "지표 설명 뒤에 연결할 표 근거를 확보합니다.");
      }
      break;
    case "browse":
      pushDataset(
        "catalog-browse",
        "required",
        primaryLabels[0] ?? question,
        "탐색형 질문이라 카탈로그가 진입점입니다.",
      );
      if (primaryLabels[0]) {
        pushDataset("table-search", "optional", primaryLabels[0], "카탈로그가 약하면 바로 표 후보도 함께 찾습니다.");
      }
      break;
    default:
      for (const label of primaryLabels.slice(0, 3)) {
        pushDataset("table-search", "required", label, "핵심 지표 후보부터 표를 찾습니다.");
      }
      if (intent.wantsIndicators || intent.requiresTimeSeries) {
        for (const label of primaryLabels.slice(0, 2)) {
          pushDataset("indicator-search", "optional", label, "표가 비면 지표 시계열/설명으로 내려갑니다.");
        }
      }
      break;
  }

  if (intent.primaryIntent !== "browse" && (intent.geographyScope === "regional" || datasets.length < 2)) {
    pushDataset(
      "catalog-browse",
      "optional",
      primaryLabels[0] ?? question,
      "검색 결과가 약할 때 주제/기관 트리에서 우회합니다.",
    );
  }

  if (datasets.length === 0) {
    pushDataset("table-search", "required", question, "최소한 원문 질문으로 한 번은 탐색해야 합니다.");
  }

  if (period.requiresTimeSeries && datasets.every((dataset) => dataset.lane === "catalog-browse")) {
    pushDataset(
      "table-search",
      "required",
      primaryLabels[0] ?? question,
      `${period.label} 비교표를 만들려면 실제 표 후보가 필요합니다.`,
    );
  }

  return datasets;
}

export function buildQuestionPlan(
  question: string,
  extraSearchHints: string[] = [],
): QuestionPlan {
  const intent = inferQuestionIntent(question);
  const indicatorCandidates = buildIndicatorCandidates(question, intent, extraSearchHints);
  const comparisonAxes = buildComparisonAxes(intent, indicatorCandidates, question);

  return {
    question,
    primaryIntent: intent.primaryIntent,
    goal: buildGoal(intent, indicatorCandidates),
    indicatorCandidates,
    comparisonAxes,
    period: buildPeriodPlan(intent),
    datasets: buildDatasetCandidates(question, intent, indicatorCandidates, extraSearchHints),
  };
}
