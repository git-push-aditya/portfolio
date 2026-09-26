// ponytail: links() drops any entry whose env var is unset instead of rendering a dead href.
function links(...pairs: [label: string, value: string | undefined][]) {
  return pairs
    .filter((p): p is [string, string] => Boolean(p[1]))
    .map(([label, href]) => ({ label, href }));
}

export const profile = {
  name: "Aditya Dubey",
  role: "AI & Backend Engineer",
  tagline:
    "I build systems that are safe by construction — infrastructure that rolls back what it created, authorization that removes credential sharing, and LLM features that can't step outside the schema.",
  email: "adityadubey0034@gmail.com",
  links: links(
    ["GitHub", process.env.NEXT_PUBLIC_GITHUB_URL],
    ["LinkedIn", process.env.NEXT_PUBLIC_LINKEDIN_URL],
    ["Twitter", process.env.NEXT_PUBLIC_TWITTER_URL],
    ["LeetCode", process.env.NEXT_PUBLIC_LEETCODE_URL],
  ),
};

export const resume = {
  fileName: "Aditya-Dubey.pdf",
  pdfUrl: "/Aditya-Dubey.pdf", // served from public/, guarantees the exact filename on download
  driveUrl: process.env.NEXT_PUBLIC_RESUME_DRIVE_URL,
};

export const about = {
  summary:
    "Final-year B.Tech Computer Science student (AI & DS) doing the work of a backend/platform engineer. I like building the infrastructure other features sit on — data access layers, provisioning tools, and authorization — and I treat model output as untrusted input rather than a trusted collaborator.",
  education: {
    school: "Indian Institute of Information Technology Kottayam",
    degree: "B.Tech Computer Science, specialization in AI & DS",
    dates: "Aug 2023 – Apr 2027",
    location: "Kerala, India",
  },
};

export const experience = [
  {
    org: "ZapData",
    sub: "subsidiary of FinanceBuddha",
    role: "AI & Backend Engineer Intern",
    dates: "May 2026 – Present",
    location: "On-site, Bengaluru",
    points: [
      "Built and solely own Shield, a 2-company internal operations platform, replacing manual SQL requests to the data team with a self-serve text-to-SQL assistant over 160M+ Snowflake records — DeepSeek V4 Pro, schema-grounded prompting, WebSocket streaming, and Clerk-backed authenticated sessions.",
      "Built an LLM-driven query-to-segment layer on Zapiq that converts free-form user queries into executable business logic, constrained to a system-defined catalogue of attributes so generated definitions stay schema-valid and safe to run; owned the catalogue lifecycle (definition, versioning, resolution) backing it.",
      "Re-architected Zapiq's (B2B product) CSV export to execute inside Snowflake (COPY INTO → S3), removing API memory limits on exports of lakhs to crores of rows; automated the underlying IAM role, trust-policy and external-stage provisioning into Ferry, a Bun CLI that cut an error-prone multi-hour setup to <2 minutes, adopted by both engineering teams.",
      "Architected end-to-end RBAC for tenants and internal staff with a support-impersonation path enabling live customer debugging without credential sharing; shipped Zapiq's centralised notification system delivering in-app and email (Mailgun) events under high volume, a URL shortener powering cross-product deep-link routing between Shield and Zapiq, and WhatsApp/Messenger integrations.",
    ],
  },
  {
    org: "Zoop Money",
    sub: "proof of concept with Arunabh Parihar, Co-founder",
    role: "Smart Contract Engineer — Real-World Asset Tokenisation (POC)",
    dates: "Oct 2025 – Feb 2026",
    location: "Remote",
    points: [
      "Built Brickchain, a permissioned real-estate tokenisation POC on ERC-3643 (T-REX) — 12 Solidity contracts making non-compliant transfers impossible at the contract level by enforcing KYC and transfer eligibility on every mint, transfer and burn via OnchainID, IdentityRegistry and modular compliance rules.",
      "Modelled each flat as exactly one token unit via on-chain supply invariants and implemented the full escrow lifecycle (listing, settlement, cancellation, ownership transfer) with a dedicated attester role for legal holds; prototyped an eRupee-style settlement rail on Hyperledger Fabric and translated Indian/EU securities requirements into contract logic.",
    ],
  },
];

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  stack: string[];
  points: string[];
  links: { label: string; href: string }[];
};

export const projects: Project[] = [
  {
    slug: "ferry",
    title: "Ferry",
    subtitle: "Infrastructure Bootstrap Engine",
    stack: ["Bun", "TypeScript", "AWS SDK", "Snowflake", "GitHub API", "Zod"],
    points: [
      "Open-source engine that makes ordering-sensitive cloud setup safe and repeatable — 55 integrations across AWS (EC2, IAM, S3), GitHub and Snowflake, including cross-provider flows such as GitHub Actions OIDC → IAM role (removing long-lived CI secrets entirely) and Secrets Manager → GitHub secrets sync.",
      "Each integration is a folder of declarative steps the engine probes and plans before mutating anything: conflicts abort pre-mutation, rollback unwinds only what the run created in reverse dependency order (including on SIGINT/SIGTERM), and secrets go to 0600 reports, never stdout. 715 tests.",
    ],
    links: links(["GitHub", process.env.NEXT_PUBLIC_FERRY_GITHUB_URL]),
  },
  {
    slug: "second-brain",
    title: "Second Brain",
    subtitle: "AI-Powered Content Management System",
    stack: ["React", "Node.js", "TypeScript", "PostgreSQL", "Redis", "Pinecone", "AWS"],
    points: [
      "Knowledge-management platform that makes saved content retrievable instead of forgotten — semantic search, shareable collections, real-time collaboration and persistent multi-turn chat, with messages and citations atomically persisted and ownership checks embedded in data-access queries.",
      "Engineered a RAG pipeline on Cohere Embed v4 + Pinecone with per-user vector isolation and similarity-threshold gating that rejects low-confidence retrievals to prevent ungrounded answers; async multi-source ingestion (web, YouTube, X, Reddit) on a Redis queue with master–worker execution, deployed as a Dockerised Express API behind Nginx on EC2 with JWT auth and GitHub Actions CI/CD.",
    ],
    links: links(
      ["Live", process.env.NEXT_PUBLIC_SECOND_BRAIN_LIVE_URL],
      ["GitHub", process.env.NEXT_PUBLIC_SECOND_BRAIN_GITHUB_URL],
    ),
  },
];

export type Achievement = {
  title: string;
  event: string;
  result: string;
  stack: string[];
  points: string[];
  links: { label: string; href: string }[];
};

export const achievements: Achievement[] = [
  {
    title: "Jigyasa",
    event: "UCO Bank × IIT Kharagpur PSB Hackathon",
    result: "Finalist, Top 20 of 500+ Teams",
    stack: ["Python", "FastAPI", "PyTorch", "React"],
    points: [
      "Real-time voice-clone detection on live calls at AUC 0.997 / 3.1% EER, using a streaming AASIST + XLS-R + AST + WavLM ensemble.",
    ],
    links: links(["GitHub", process.env.NEXT_PUBLIC_JIGYASA_GITHUB_URL]),
  },
  {
    title: "SatvaNetra",
    event: "CIDEcode Hackathon — CID Karnataka Cybersecurity Division",
    result: "2nd Place, National Level (50+ competing teams)",
    stack: [],
    points: [
      "Led a 4-member team to build photo/video/audio deepfake detection at 95% accuracy, shipped inside the 48-hour window.",
    ],
    links: links(["GitHub", process.env.NEXT_PUBLIC_SATVANETRA_GITHUB_URL]),
  },
];

export const skills: Record<string, string[]> = {
  Languages: ["TypeScript", "JavaScript", "Python", "Go", "Solidity", "C++", "SQL"],
  "Backend & AI": [
    "Node.js",
    "Bun",
    "Express.js",
    "REST APIs",
    "GraphQL",
    "WebSockets",
    "Prisma",
    "FastAPI",
    "Flask",
    "RAG",
    "text-to-SQL",
    "embeddings",
    "prompt engineering",
  ],
  "Infrastructure & Data": [
    "Docker",
    "Kubernetes",
    "AWS (EC2, ECS, S3, Lambda, IAM, STS)",
    "Nginx",
    "GitHub Actions CI/CD",
    "Prometheus",
    "Grafana",
    "PostgreSQL",
    "MongoDB",
    "Snowflake",
    "Redis",
    "Pinecone",
    "Supabase",
  ],
  "Blockchain & Frontend": [
    "ERC-3643 (T-REX)",
    "OpenZeppelin",
    "Hardhat",
    "ethers.js",
    "Hyperledger Fabric",
    "React.js",
    "Next.js",
    "TailwindCSS",
  ],
};
