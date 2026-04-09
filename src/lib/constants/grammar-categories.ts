export const GRAMMAR_CATEGORIES = [
  { id: "tenses", name: "Tense System", bandImpact: "high", topics: "Present Simple/Continuous/Perfect, Past Simple/Perfect, Future forms, Mixed tenses" },
  { id: "complex_sentences", name: "Complex Sentences", bandImpact: "high", topics: "Relative clauses, Adverbial clauses (because, although, while, if), Noun clauses" },
  { id: "passive", name: "Passive Voice", bandImpact: "high", topics: "All tenses in passive, Passive reporting (It is believed...), Passive with modals" },
  { id: "conditionals", name: "Conditionals", bandImpact: "medium", topics: "Zero, First, Second, Third, Mixed conditionals, unless, provided that" },
  { id: "reported_speech", name: "Reported Speech", bandImpact: "medium", topics: "Tense backshift, Reporting verbs (claim, suggest, argue, maintain)" },
  { id: "comparatives", name: "Comparatives & Superlatives", bandImpact: "medium", topics: "Regular/irregular, Double comparatives, as...as, modifiers" },
  { id: "articles", name: "Articles & Determiners", bandImpact: "medium", topics: "a/an/the, zero article, quantifiers, demonstratives" },
  { id: "modals", name: "Modal Verbs", bandImpact: "medium", topics: "Ability, permission, obligation, probability, advice, Modal perfects" },
  { id: "gerunds_infinitives", name: "Gerunds & Infinitives", bandImpact: "medium", topics: "Verb patterns, Subject gerunds, Purpose infinitives" },
  { id: "nominalization", name: "Nominalization", bandImpact: "high", topics: "Verb→noun (investigate→investigation), Adj→noun. Band 7+ essential" },
  { id: "inversion", name: "Inversion & Emphasis", bandImpact: "low", topics: "Not only...but also, Rarely do..., It is X that..., Band 7+" },
  { id: "parallel", name: "Parallel Structure", bandImpact: "low", topics: "Balancing clauses, list formatting, consistent verb forms" },
  { id: "cohesion", name: "Cohesive Devices", bandImpact: "high", topics: "Linking words (however, moreover), Reference words (this, these, such)" },
  { id: "sva", name: "Subject-Verb Agreement", bandImpact: "medium", topics: "Collective nouns, Each/every, There is/are, Quantity expressions" },
] as const;

export type GrammarCategory = (typeof GRAMMAR_CATEGORIES)[number];
