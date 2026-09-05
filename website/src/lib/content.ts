export const FEATURES = [
  {
    slug: "research-discovery",
    title: "Research Discovery",
    short:
      "Turn a topic into a themed literature review, drawn only from real open-access sources.",
    detail:
      "Type a research topic in English or Bahasa Malaysia. AASP searches open-access literature (Semantic Scholar, DOAJ, OpenAlex), then organizes what it finds into themes, key findings, and research gaps — every claim linked back to its source paper. No fabricated findings, no paywalled content stored or redistributed.",
    example:
      "“What's the research on mobile learning access for rural students?” becomes a themed summary with gaps you can build your own angle on — in minutes, not an afternoon of manual reading.",
  },
  {
    slug: "integrity-advisor",
    title: "Academic Integrity Advisor",
    short:
      "Ask if an AI tool is okay to use — get an answer grounded in your own university's policy.",
    detail:
      "The Integrity Advisor answers questions about AI-use rules, plagiarism, citation methods, and misconduct consequences using retrieval-augmented generation grounded strictly in your institution's own uploaded policy documents — not generic web knowledge. Every answer cites the specific policy text it drew from, and when there isn't a confident match, it says so and points you to a real staff contact instead of guessing.",
    example:
      "“Boleh saya guna ChatGPT untuk ringkaskan bacaan saya?” gets answered in Bahasa Malaysia, grounded in your university's actual AI-use policy.",
  },
  {
    slug: "writing-support",
    title: "Writing Support Agent",
    short:
      "Structured feedback on your draft — never a rewritten paragraph in your place.",
    detail:
      "Paste a paragraph or abstract and get feedback across four fixed categories: argument clarity, citation gaps, grammar, and improvement suggestions. The agent is built to never output a drop-in replacement for your writing — feedback only, by design, so the tool stays integrity-safe rather than becoming a shortcut.",
    example:
      "See exactly where a claim needs a citation, before your marker does — not a rewritten version of your own words.",
  },
  {
    slug: "source-organiser",
    title: "Source Organiser",
    short:
      "Paste a list of links or titles, get a formatted, credibility-checked reference list.",
    detail:
      "Submit a batch of URLs or paper titles and get back a properly formatted APA reference list, each entry annotated with a one-to-two sentence summary and classified by credibility tier — peer-reviewed, conference paper, grey literature, or non-academic — with a stated basis for the classification. Unresolvable entries are flagged, never silently dropped.",
    example:
      "Twenty scattered links in, one clean, gradeable reference list out.",
  },
] as const;

export const PROBLEM_STATS = [
  {
    label: "No campus library",
    detail:
      "Rural-campus and distance-learning B40 students often have no physical library or writing centre to turn to.",
  },
  {
    label: "No one to ask 'is this allowed?'",
    detail:
      "Without institution-specific guidance, students either avoid AI tools entirely or risk misconduct by misusing them.",
  },
  {
    label: "Feedback arrives too late",
    detail:
      "With no tutor to review drafts, structural and citation problems surface only at grading — too late to fix.",
  },
] as const;
