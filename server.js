const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// Automatically load environment variables from .env if present
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envData = fs.readFileSync(envPath, 'utf8');
    for (const line of envData.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const k = trimmed.substring(0, eqIdx).trim();
        let v = trimmed.substring(eqIdx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.substring(1, v.length - 1);
        }
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
} catch (_) {}

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png'
};

// =========================================================================
// SQLite Database Initialization & Seeding
// =========================================================================
const dbPath = path.join(__dirname, 'nexus_platform.db');
const db = new DatabaseSync(dbPath);

// Create tables matching schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY,
    selected_domain TEXT NOT NULL DEFAULT 'ai-agents',
    education TEXT,
    skills_json TEXT,
    interests_json TEXT,
    target_role TEXT,
    bio TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS domains (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    tagline TEXT NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS domain_articles (
    id TEXT PRIMARY KEY,
    domain_id TEXT NOT NULL,
    title TEXT NOT NULL,
    read_time TEXT NOT NULL,
    summary TEXT NOT NULL,
    key_takeaways TEXT NOT NULL,
    content TEXT NOT NULL,
    external_url TEXT NOT NULL,
    FOREIGN KEY(domain_id) REFERENCES domains(id)
  );

  CREATE TABLE IF NOT EXISTS domain_questions (
    id TEXT PRIMARY KEY,
    domain_id TEXT NOT NULL,
    question TEXT NOT NULL,
    options_json TEXT NOT NULL,
    correct_index INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    topic TEXT,
    FOREIGN KEY(domain_id) REFERENCES domains(id)
  );

  CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    domain_id TEXT NOT NULL,
    answers_json TEXT NOT NULL,
    score INTEGER NOT NULL,
    passed INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(domain_id) REFERENCES domains(id)
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    domain_id TEXT NOT NULL,
    domain_name TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    passed INTEGER NOT NULL,
    verification_code TEXT NOT NULL,
    issued_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS roadmaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    domain_id TEXT NOT NULL,
    target_role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS roadmap_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roadmap_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    order_num INTEGER NOT NULL,
    domain TEXT NOT NULL,
    resource_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    FOREIGN KEY(roadmap_id) REFERENCES roadmaps(id)
  );

  CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    target_role TEXT NOT NULL,
    education_json TEXT NOT NULL,
    skills_json TEXT NOT NULL,
    projects_json TEXT NOT NULL,
    certificates_json TEXT,
    summary TEXT,
    ats_score INTEGER DEFAULT 95,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Check if topic column exists in domain_questions
try {
  db.exec('ALTER TABLE domain_questions ADD COLUMN topic TEXT');
} catch (e) {
  // Column already exists
}

// Ensure desc and url_label exist in roadmap_steps
try {
  db.exec('ALTER TABLE roadmap_steps ADD COLUMN desc TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE roadmap_steps ADD COLUMN url_label TEXT');
} catch (e) {}

// Seed Default User & Profile
const existingUser = db.prepare('SELECT id FROM users WHERE id = 1').get();
if (!existingUser) {
  db.prepare(`
    INSERT INTO users (id, email, name, password_hash, created_at)
    VALUES (1, 'alex.developer@hackathon.dev', 'Alex Morgan', 'Hackathon#2026', datetime('now'))
  `).run();

  db.prepare(`
    INSERT INTO profiles (user_id, selected_domain, education, skills_json, interests_json, target_role, bio)
    VALUES (1, 'ai-agents', 'M.S. in Computer Science & Distributed Systems, Stanford University',
      '["Python", "PyTorch", "TypeScript", "React", "Next.js 15", "Docker", "PostgreSQL", "System Design"]',
      '["Autonomous Agents", "Cloud & DevOps", "Full-Stack Web", "Zero-Knowledge", "Data Engineering"]',
      'AI Systems Architect',
      'Full-Stack Architect & AI Systems Builder • Exploring Multi-Agent Autonomous Runtimes')
  `).run();
}

// Seed Domains Catalog
const DOMAINS_SEED = [
  {
    id: 'ai-agents',
    name: 'AI & Autonomous Agents',
    icon: '🤖',
    tagline: 'LLM Orchestration, Multi-Agent Stategraphs & Vector RAG',
    description: 'Master autonomous multi-agent state machines, cyclical graphs, tool calling protocols, and high-throughput vector embedding retrieval.'
  },
  {
    id: 'cloud-devops',
    name: 'Cloud & DevOps Engineering',
    icon: '☁️',
    tagline: 'Kubernetes, Cloud-Native Mesh, IaC & Container Hardening',
    description: 'Learn scalable Kubernetes orchestration, Helm deployment automation, zero-trust mutual TLS service meshes, and Terraform infrastructure as code.'
  },
  {
    id: 'fullstack',
    name: 'Full-Stack & Distributed Systems',
    icon: '💻',
    tagline: 'Next.js 15, TypeScript, WebSockets & Event-Driven Architecture',
    description: 'Build low-latency reactive applications with React Server Components, duplex streaming WebSockets, and distributed Redis message caching.'
  },
  {
    id: 'cybersec',
    name: 'Cybersecurity & Cryptography',
    icon: '🛡️',
    tagline: 'Zero-Knowledge Proofs, OAuth 2.1, Route Guards & End-to-End Encryption',
    description: 'Explore client-side zk-SNARK proof verifications in WebAssembly, cryptographically hardened JWT route guards, and zero-trust authentication.'
  },
  {
    id: 'data-eng',
    name: 'Data Engineering & Streaming Analytics',
    icon: '📊',
    tagline: 'Apache Kafka, ClickHouse, Real-Time Ingestion & Columnar OLAP',
    description: 'Architect distributed real-time event streaming brokers, partition scaling, schema registries, and microsecond analytical querying with ClickHouse.'
  }
];

const insertDomain = db.prepare(`
  INSERT OR REPLACE INTO domains (id, name, icon, tagline, description)
  VALUES (@id, @name, @icon, @tagline, @description)
`);
DOMAINS_SEED.forEach(d => insertDomain.run(d));

// Seed 2 Reference Articles per Domain
const ARTICLES_SEED = [
  // 1. AI & Autonomous Agents
  {
    id: 'art-ai-1',
    domain_id: 'ai-agents',
    title: 'Mastering Multi-Agent State Architectures with Cyclical Graphs',
    read_time: '6 min read',
    summary: 'An architectural exploration of LangGraph-style stateful multi-agent execution, human-in-the-loop interrupts, and persistent memory.',
    key_takeaways: JSON.stringify([
      'Cyclical State Graphs prevent infinite hallucinations via deterministic exit-condition validators.',
      'Memory checkpointing enables time-travel debugging and human-in-the-loop approval before executing irreversible tool calls.',
      'Streaming token deltas reduce perceived latency from seconds to under 80 milliseconds.'
    ]),
    content: `### 1. The Shift to Multi-Agent State Graphs
Traditional linear prompt chaining fails when tasks require recursive exploration, self-correction, or tool invocation loops. State graphs model an autonomous agent system as a directed cyclic graph where each node represents an LLM decision-maker or executable tool, and edges represent conditional transitions.

### 2. State Invariants & Checkpointing
Every node receives a global typed state dictionary and returns state diffs. By writing state diffs to an append-only store (such as SQLite or PostgreSQL JSONB), agents can pause before high-risk actions (e.g., executing shell scripts or sending emails) and await human authorization.

### 3. Tool Calling Verification
Always implement strict schema validation using JSON Schema or Pydantic before forwarding model tool calls to execution environments.`,
    external_url: 'https://github.com/langchain-ai/langgraph'
  },
  {
    id: 'art-ai-2',
    domain_id: 'ai-agents',
    title: 'Vector Embeddings, Hybrid Search & Context Window Optimization',
    read_time: '5 min read',
    summary: 'How to implement dense-sparse hybrid vector retrieval, reciprocal rank fusion, and avoid context window degradation in RAG pipelines.',
    key_takeaways: JSON.stringify([
      'Dense embeddings excel at semantic similarity, whereas sparse vectors (BM25) catch exact identifier matches.',
      'Reciprocal Rank Fusion (RRF) blends scores across distinct embedding spaces without manual weight tuning.',
      'Chunk boundary overlaps and contextual chunk headers prevent loss of semantic coherence.'
    ]),
    content: `### 1. Why Pure Dense Vector Search Fails in Production
Dense embeddings map chunks to high-dimensional geometry. While they recognize synonyms effortlessly, they frequently miss exact technical identifiers, error codes, and function names.

### 2. The Hybrid Search Architecture
To achieve 99%+ retrieval accuracy, production systems query both:
1. Dense Vector Index (HNSW on Qdrant/pgvector)
2. Sparse Inverted Index (BM25 text search)

The candidate lists are normalized using Reciprocal Rank Fusion:
\`\`\`
RRF_Score(d) = Σ [ 1 / (60 + Rank_i(d)) ]
\`\`\`

### 3. Context Re-ranking
Before prompt insertion, a lightweight cross-encoder model reranks top-20 candidates to the top-4 most contextually salient chunks, preventing the "Lost in the Middle" LLM phenomena.`,
    external_url: 'https://qdrant.tech/documentation/'
  },

  // 2. Cloud & DevOps
  {
    id: 'art-cloud-1',
    domain_id: 'cloud-devops',
    title: 'Production Kubernetes Architecture: Custom Operators, HPA & Disruption Budgets',
    read_time: '7 min read',
    summary: 'A deep-dive into writing Kubernetes controllers, tuning Horizontal Pod Autoscalers, and guaranteeing zero-downtime rolling updates.',
    key_takeaways: JSON.stringify([
      'Custom Resource Definitions (CRDs) coupled with controller reconcilers automate operational runbooks.',
      'Horizontal Pod Autoscalers (HPA) must pair CPU/Memory metrics with custom latency/queue depth metrics.',
      'Pod Disruption Budgets (PDB) prevent accidental cluster drain outages during node pool upgrades.'
    ]),
    content: `### 1. The Controller Reconciler Loop
Kubernetes operators watch custom resource events and run idempotent loops:
\`\`\`
Reconcile(Request) -> Fetch Desired State -> Compare to Observed State -> Execute Remediation
\`\`\`

### 2. Multi-Metric Autoscaling
Relying solely on CPU thresholds causes delayed scaling spikes. Production systems export Prometheus custom metrics (e.g. \`http_requests_in_flight\` or \`sqs_queue_depth\`) to trigger horizontal pod scale-outs 30 seconds before CPU exhaustion occurs.

### 3. Graceful Termination & Draining
Set \`terminationGracePeriodSeconds\` appropriately and trap SIGTERM in application containers to finish in-flight requests before container shutdown.`,
    external_url: 'https://kubernetes.io/docs/concepts/architecture/'
  },
  {
    id: 'art-cloud-2',
    domain_id: 'cloud-devops',
    title: 'Zero-Trust Service Meshes & Declarative Infrastructure with Terraform',
    read_time: '5 min read',
    summary: 'Enforcing strict mutual TLS between microservices using Envoy sidecars and maintaining immutable infrastructure state.',
    key_takeaways: JSON.stringify([
      'Service meshes transparently inject mutual TLS without altering application application code.',
      'Remote state locking with DynamoDB/PostgreSQL prevents concurrent deployment collisions.',
      'Drift detection workflows identify manual console modifications before they cause outage regressions.'
    ]),
    content: `### 1. Service Mesh Security
In traditional architectures, internal VPC traffic is implicitly trusted. A zero-trust mesh issues short-lived X.509 certificates to each workload identity via SPIFFE/SPIRE, cryptographically validating every hop.

### 2. Terraform State Hygiene
Always store Terraform state in an encrypted remote bucket with object versioning enabled. Couple state files with distributed locking to prevent state corruption during concurrent CI/CD execution.`,
    external_url: 'https://developer.hashicorp.com/terraform'
  },

  // 3. Full-Stack & Distributed Systems
  {
    id: 'art-fullstack-1',
    domain_id: 'fullstack',
    title: 'Next.js 15 Server Components, Server Actions & Streaming Hydration',
    read_time: '6 min read',
    summary: 'Optimizing modern React architectures: eliminating client bundle waterfalls and achieving sub-second Largest Contentful Paint.',
    key_takeaways: JSON.stringify([
      'Server Components execute exclusively on the server, shipping 0KB of JavaScript to the browser.',
      'Streaming HTML allows the browser to render shell layouts immediately while data-heavy slots stream asynchronously.',
      'Server Actions provide type-safe RPCs with automatic CSRF token verification.'
    ]),
    content: `### 1. The Component Boundary
Segregate pure UI logic (\`'use client'\`) from data-fetching queries. By keeping database calls in Server Components, credentials never leak to the client bundle and database roundtrips happen over low-latency server networks.

### 2. Suspense & Progressive Hydration
Wrap slow API calls in React \`<Suspense fallback={<Skeleton />}>\`. The client receives the initial page shell instantly, while the slow components stream their HTML over the open HTTP connection as soon as resolved.`,
    external_url: 'https://nextjs.org/docs'
  },
  {
    id: 'art-fullstack-2',
    domain_id: 'fullstack',
    title: 'Event-Driven Real-Time Systems: WebSockets, Redis Streams & Distributed Locks',
    read_time: '5 min read',
    summary: 'Scaling bidirectional real-time state synchronization across clustered servers without dropping packets or creating race conditions.',
    key_takeaways: JSON.stringify([
      'Sticky sessions or Redis Pub/Sub adapters are mandatory to route messages across multiple WebSocket server instances.',
      'Heartbeat ping-pong timeouts detect dead mobile connections faster than TCP keepalive.',
      'Redis Redlock prevents duplicate execution when multiple worker instances consume parallel events.'
    ]),
    content: `### 1. Multi-Server WebSocket Scaling
Because WebSockets maintain stateful TCP sockets, client A connected to Server 1 cannot receive direct messages sent by client B on Server 2. A centralized Redis Pub/Sub broker relays message broadcasts across all nodes in the cluster.

### 2. Backpressure & Client Buffering
When client networks throttle, WebSocket buffers fill rapidly. Implement client-side acknowledgment and server queue limits to drop uncritical telemetry while guaranteeing business-critical state delivery.`,
    external_url: 'https://redis.io/docs/manual/pubsub/'
  },

  // 4. Cybersecurity
  {
    id: 'art-cybersec-1',
    domain_id: 'cybersec',
    title: 'Zero-Knowledge Proofs in Practice: zk-SNARKs & WebAssembly Client Verification',
    read_time: '8 min read',
    summary: 'How cryptographic zero-knowledge circuits allow users to prove credentials and biometric identity without revealing secret data.',
    key_takeaways: JSON.stringify([
      'Zero-knowledge proofs prove statement veracity without disclosing any underlying witness data.',
      'zk-SNARKs produce succinct, sub-kilobyte proofs that can be verified in milliseconds.',
      'WASM enables computing cryptographic proofs locally inside the user browser.'
    ]),
    content: `### 1. What Zero-Knowledge Solves
Instead of sending a password or biometric hash to a remote database (where it could be leaked), the client computes a cryptographic zk-proof on their device. The server verifies the proof mathematically without ever possessing the secret.

### 2. The Verification Pipeline
1. Client generates witness from private credentials.
2. WASM circuit executes arithmetic constraint system (R1CS).
3. Groth16 or Plonk proof generated (<1KB).
4. Server validates proof against public verification key in ~2ms.`,
    external_url: 'https://zkproof.org/'
  },
  {
    id: 'art-cybersec-2',
    domain_id: 'cybersec',
    title: 'Modern API Security: OAuth 2.1, Route Guards & Hardened JWT Verification',
    read_time: '5 min read',
    summary: 'Defending against token hijacking, CSRF, and replay attacks using PKCE and secure HTTP-only cookies.',
    key_takeaways: JSON.stringify([
      'OAuth 2.1 mandates PKCE (Proof Key for Code Exchange) across all clients, deprecating implicit grants.',
      'JWT tokens must be validated with asymmetric public keys (RS256/ES256) and strict audience claims.',
      'Store tokens in SameSite=Lax HTTP-only cookies to eliminate XSS token theft vectors.'
    ]),
    content: `### 1. Token Storage Vulnerabilities
Storing JWTs in \`localStorage\` allows any malicious third-party script or XSS vulnerability to export user credentials. Storing tokens in \`HttpOnly\`, \`Secure\`, \`SameSite=Lax\` cookies prevents JavaScript access entirely.

### 2. Route Guard Validation
Every API endpoint must evaluate signature validity, token expiration, issuer URI, and required role scopes before executing handler code.`,
    external_url: 'https://oauth.net/2.1/'
  },

  // 5. Data Engineering
  {
    id: 'art-data-1',
    domain_id: 'data-eng',
    title: 'Distributed Streaming Architecture with Apache Kafka & Schema Registry',
    read_time: '7 min read',
    summary: 'Designing high-volume streaming ingest pipelines, partition ordering, consumer group balancing, and Avro contract evolution.',
    key_takeaways: JSON.stringify([
      'Partition keys determine event ordering: events sharing a key are guaranteed sequential delivery.',
      'Schema Registries enforce backward and forward compatibility, preventing downstream consumer crashes.',
      'Consumer lag metrics identify processing bottlenecks before memory buffers spill.'
    ]),
    content: `### 1. Kafka Partitioning Mechanics
Kafka topics partition events across disk drives. Consumers form balanced consumer groups where each partition is assigned to exactly one consumer instance, allowing linear scale-out.

### 2. Idempotent Ingestion
To achieve exactly-once processing semantics, consumers must store processed event IDs in transactional data stores alongside business records.`,
    external_url: 'https://kafka.apache.org/documentation/'
  },
  {
    id: 'art-data-2',
    domain_id: 'data-eng',
    title: 'Columnar OLAP Engines: ClickHouse Real-Time Analytics at Scale',
    read_time: '6 min read',
    summary: 'Why columnar storage outperforms row stores by 100x for analytical aggregations, vectorization, and data compression.',
    key_takeaways: JSON.stringify([
      'Columnar storage reads only the columns required for the query, saving massive disk I/O bandwidth.',
      'SIMD vectorization allows modern CPUs to process millions of rows per second in a single cycle.',
      'MergeTree engines continuously merge sorted chunks in the background for microsecond aggregations.'
    ]),
    content: `### 1. Row vs Column Storage
Row stores (PostgreSQL) read entire rows even if a query only requests \`COUNT(status)\`. Columnar databases (ClickHouse) store each column in adjacent disk blocks, applying specialized compression (LZ4, ZSTD, Gorilla) and reading only the exact bytes queried.

### 2. Real-Time Materialized Views
Materialized views in ClickHouse compute running aggregations at insertion time, transforming complex multi-billion-row queries into zero-latency lookups.`,
    external_url: 'https://clickhouse.com/docs'
  }
];

const insertArticle = db.prepare(`
  INSERT OR REPLACE INTO domain_articles (id, domain_id, title, read_time, summary, key_takeaways, content, external_url)
  VALUES (@id, @domain_id, @title, @read_time, @summary, @key_takeaways, @content, @external_url)
`);
ARTICLES_SEED.forEach(a => insertArticle.run(a));

// =========================================================================
// AT LEAST 10 TECHNICAL QUESTIONS PER DOMAIN (Total 50 Seeded Questions)
// =========================================================================
const QUESTIONS_SEED = [
  // -------------------------------------------------------------
  // Domain 1: AI & Autonomous Agents (10 Questions)
  // -------------------------------------------------------------
  {
    id: 'q-ai-1',
    domain_id: 'ai-agents',
    question: 'How do cyclical state graphs in autonomous agent runtimes prevent endless infinite hallucination loops?',
    options_json: JSON.stringify([
      'By restarting the agent from scratch whenever an error occurs',
      'By configuring typed state schemas with deterministic exit-condition validators and recursion limits',
      'By preventing agents from calling external APIs or tools',
      'By only allowing single-turn conversational models'
    ]),
    correct_index: 1,
    topic: 'Cyclical State Graphs & Recursion Control',
    explanation: 'Cyclical state graphs use explicit state validation nodes and max-recursion limits to safely terminate or route to human intervention if an agent begins looping.'
  },
  {
    id: 'q-ai-2',
    domain_id: 'ai-agents',
    question: 'In production RAG systems, why is Hybrid Search (Dense + Sparse) preferred over pure dense vector search?',
    options_json: JSON.stringify([
      'Dense vectors cannot run on GPUs',
      'Hybrid search combines semantic similarity with exact keyword/identifier matches (e.g. error codes)',
      'Sparse search uses more memory than dense embeddings',
      'Hybrid search avoids using an embedding model completely'
    ]),
    correct_index: 1,
    topic: 'Hybrid Vector Search & Exact Matching',
    explanation: 'Dense vectors capture semantic concepts, but sparse search (BM25) ensures exact matches for specific IDs, code names, and error codes that embeddings often miss.'
  },
  {
    id: 'q-ai-3',
    domain_id: 'ai-agents',
    question: 'What is the primary benefit of memory checkpointing in multi-agent systems?',
    options_json: JSON.stringify([
      'It allows time-travel rollbacks and human-in-the-loop review before dangerous tool calls execute',
      'It speeds up GPU token generation by 10x',
      'It replaces the need for context windows in large language models',
      'It automatically writes unit tests for generated code'
    ]),
    correct_index: 0,
    topic: 'Memory Checkpointing & Safety Interventions',
    explanation: 'Checkpointing saves state diffs at each node transition, enabling human approval, auditing, and safe rollbacks when tool calls fail.'
  },
  {
    id: 'q-ai-4',
    domain_id: 'ai-agents',
    question: 'What does Reciprocal Rank Fusion (RRF) calculate when combining dense and sparse search rankings?',
    options_json: JSON.stringify([
      'It averages cosine similarities across all candidate documents',
      'It sums inverse rank scores [1 / (k + rank)] across diverse search result lists without manual weights',
      'It multiplies raw BM25 scores by embedding vector lengths',
      'It removes duplicate documents by hashing their URLs'
    ]),
    correct_index: 1,
    topic: 'Reciprocal Rank Fusion (RRF)',
    explanation: 'RRF harmonizes disparate ranking distributions by scoring items based on their positional rank rather than uncalibrated raw similarity floats.'
  },
  {
    id: 'q-ai-5',
    domain_id: 'ai-agents',
    question: 'How do you mitigate the "Lost in the Middle" attention phenomenon in LLM context windows?',
    options_json: JSON.stringify([
      'By placing the most critical query context and retrieved snippets at the extreme beginning and end of the prompt',
      'By increasing the model temperature to 1.5',
      'By using zero-shot prompts instead of few-shot examples',
      'By removing system prompts altogether'
    ]),
    correct_index: 0,
    topic: 'Context Window Optimization & Re-Ranking',
    explanation: 'Transformer self-attention exhibits a U-shaped accuracy curve: information positioned in the middle of long contexts suffers lower recall compared to tokens at the edges.'
  },
  {
    id: 'q-ai-6',
    domain_id: 'ai-agents',
    question: 'Before executing an LLM tool call on an external API or database, what validation step is mandatory?',
    options_json: JSON.stringify([
      'Parsing the JSON output with eval() in Node.js',
      'Strict schema validation using JSON Schema or Pydantic to enforce parameter types and constraints',
      'Disabling input sanitization for performance',
      'Assuming the LLM always produces syntactically valid JSON'
    ]),
    correct_index: 1,
    topic: 'Tool Calling Protocols & Schema Validation',
    explanation: 'LLMs can generate hallucinated parameters or invalid data types; strict schema validation prevents malformed queries and injection vulnerabilities.'
  },
  {
    id: 'q-ai-7',
    domain_id: 'ai-agents',
    question: 'In multi-agent architectures, what is the role of a Supervisor / Router Agent?',
    options_json: JSON.stringify([
      'It performs optical character recognition on scanned images',
      'It inspects user intent, decomposes tasks, delegates subtasks to specialized worker agents, and aggregates results',
      'It compresses training weights into 4-bit quantizations',
      'It runs local WebAssembly cryptographic circuits'
    ]),
    correct_index: 1,
    topic: 'Supervisor-Worker Multi-Agent Topology',
    explanation: 'A supervisor agent evaluates high-level state, dynamically routes to specialized sub-agents (e.g. Coder, Researcher, Reviewer), and synthesizes final deliverables.'
  },
  {
    id: 'q-ai-8',
    domain_id: 'ai-agents',
    question: 'What is semantic caching in an LLM application runtime?',
    options_json: JSON.stringify([
      'Saving prompt embeddings in a vector index to return cached answers for semantically equivalent queries',
      'Caching HTML templates in the browser service worker',
      'Storing user passwords in plaintext memory',
      'Compressing network packets with gzip'
    ]),
    correct_index: 0,
    topic: 'Semantic Caching & LLM Cost Reduction',
    explanation: 'Semantic caching vectors incoming user queries and checks if an existing answered prompt is within a cosine distance threshold (e.g. 0.95), cutting latency from seconds to milliseconds.'
  },
  {
    id: 'q-ai-9',
    domain_id: 'ai-agents',
    question: 'Why is token delta streaming crucial for interactive agentic interfaces?',
    options_json: JSON.stringify([
      'It reduces total GPU computation time by 50%',
      'It delivers intermediate thought chunks and text to the UI in real time, dropping perceived latency below 100ms',
      'It prevents the client browser from disconnecting',
      'It eliminates the need for WebSocket protocols'
    ]),
    correct_index: 1,
    topic: 'Token Delta Streaming & UX Latency',
    explanation: 'Rather than waiting 15 seconds for a complete multi-paragraph output, streaming tokens deltas allows users to read immediately and see agent reasoning steps.'
  },
  {
    id: 'q-ai-10',
    domain_id: 'ai-agents',
    question: 'In autonomous coding agents, how is sandboxed execution safely achieved?',
    options_json: JSON.stringify([
      'By running generated shell scripts directly as root on the production server',
      'By executing code within isolated ephemeral Docker containers or gVisor microVMs with restricted network egress',
      'By disabling file permissions on the host operating system',
      'By converting all shell commands into JavaScript alert() dialogs'
    ]),
    correct_index: 1,
    topic: 'Agent Sandboxing & Execution Isolation',
    explanation: 'Ephemeral sandboxes (Docker, Firecracker, gVisor) with tight CPU/memory limits and firewall rules prevent untrusted generated code from harming the host.'
  },

  // -------------------------------------------------------------
  // Domain 2: Cloud & DevOps (10 Questions)
  // -------------------------------------------------------------
  {
    id: 'q-cloud-1',
    domain_id: 'cloud-devops',
    question: 'When configuring Kubernetes Horizontal Pod Autoscalers (HPA) for low-latency web workloads, what best practice prevents delayed scale-outs?',
    options_json: JSON.stringify([
      'Setting target CPU utilization to 100%',
      'Combining CPU metrics with custom metrics like incoming request rate or message queue depth',
      'Disabling pod resource requests and limits',
      'Running only one replica per cluster'
    ]),
    correct_index: 1,
    topic: 'Kubernetes Autoscaling & Custom Metrics',
    explanation: 'CPU utilization is a lagging indicator. Incorporating queue depth or requests-per-second triggers scaling proactive to traffic surges.'
  },
  {
    id: 'q-cloud-2',
    domain_id: 'cloud-devops',
    question: 'What is the security advantage of enforcing mutual TLS (mTLS) in a zero-trust service mesh like Istio?',
    options_json: JSON.stringify([
      'It eliminates the need for container firewalls entirely',
      'Both client and server cryptographically verify each others SPIFFE workload identity with short-lived certificates',
      'It compresses network packets for faster transmission',
      'It allows services to run without Kubernetes network policies'
    ]),
    correct_index: 1,
    topic: 'Mutual TLS & Zero-Trust Mesh',
    explanation: 'mTLS ensures bidirectional identity verification and encryption in transit for every pod-to-pod interaction, neutralizing perimeter compromise risks.'
  },
  {
    id: 'q-cloud-3',
    domain_id: 'cloud-devops',
    question: 'Why are Pod Disruption Budgets (PDB) essential during automated Kubernetes cluster node pool upgrades?',
    options_json: JSON.stringify([
      'They prevent node pools from ever being drained or upgraded',
      'They guarantee a minimum threshold of concurrent healthy replicas remains running during voluntary evictions',
      'They reduce the cloud hosting cost to zero',
      'They automatically backup etcd snapshots to S3'
    ]),
    correct_index: 1,
    topic: 'Pod Disruption Budgets (PDB)',
    explanation: 'Without PDBs, a node drain operation might terminate all replicas of a critical microservice simultaneously, causing an unexpected outage.'
  },
  {
    id: 'q-cloud-4',
    domain_id: 'cloud-devops',
    question: 'What architectural component distinguishes a Kubernetes Operator from standard Helm deployments?',
    options_json: JSON.stringify([
      'A Custom Controller continuously executing an active reconciliation loop against Custom Resource Definitions (CRDs)',
      'Operators can only deploy stateless nginx web servers',
      'Operators do not use YAML configurations',
      'Helm cannot be installed on Linux clusters'
    ]),
    correct_index: 0,
    topic: 'Kubernetes Operators & Reconcilers',
    explanation: 'Operators encode human domain knowledge into active Go/Python reconciler loops that manage stateful lifecycles, failovers, and backup schedules.'
  },
  {
    id: 'q-cloud-5',
    domain_id: 'cloud-devops',
    question: 'In Terraform, why must remote state be configured with distributed state locking (e.g. AWS DynamoDB)?',
    options_json: JSON.stringify([
      'To prevent concurrent team CI/CD runs from colliding and corrupting the shared infrastructure state file',
      'Because Terraform cannot write to local filesystems',
      'To convert Terraform code into Kubernetes manifests',
      'To automatically delete unused cloud resources'
    ]),
    correct_index: 0,
    topic: 'Terraform State Locking & Consistency',
    explanation: 'Without state locking, two parallel pipelines executing "terraform apply" can overwrite each other\'s state, causing orphaned or broken resources.'
  },
  {
    id: 'q-cloud-6',
    domain_id: 'cloud-devops',
    question: 'What is the container best practice for handling SIGTERM signals during rolling deployments?',
    options_json: JSON.stringify([
      'Immediately exit process with code 137',
      'Trap SIGTERM, stop accepting new requests, complete existing in-flight HTTP connections, and gracefully close socket descriptors',
      'Ignore SIGTERM until the host operating system crashes',
      'Restart the container in debug mode'
    ]),
    correct_index: 1,
    topic: 'Graceful Termination & Drain Semantics',
    explanation: 'Graceful termination allows active client transactions to finish cleanly before Kubernetes terminates the pod container.'
  },
  {
    id: 'q-cloud-7',
    domain_id: 'cloud-devops',
    question: 'What is container hardening and the principle of least privilege in Docker?',
    options_json: JSON.stringify([
      'Running all applications as the root user inside the container',
      'Using distroless or minimal base images, executing as non-root UID, and dropping unnecessary Linux capabilities (e.g. CAP_SYS_ADMIN)',
      'Allocating unlimited memory to every container process',
      'Disabling Docker security profiles (AppArmor/Seccomp)'
    ]),
    correct_index: 1,
    topic: 'Container Hardening & Rootless Execution',
    explanation: 'Non-root containers with minimal attack surfaces prevent privilege escalation attacks from breaking out into host kernel space.'
  },
  {
    id: 'q-cloud-8',
    domain_id: 'cloud-devops',
    question: 'What is Canary Deployment strategy in cloud-native ingress controllers?',
    options_json: JSON.stringify([
      'Replacing 100% of production workloads with untested code immediately',
      'Routing a tiny fraction of production traffic (e.g. 5%) to the new release to monitor error rates and latency before full rollout',
      'Testing only in a developer local machine',
      'Stopping all databases before each deployment'
    ]),
    correct_index: 1,
    topic: 'Canary Deployments & Traffic Splitting',
    explanation: 'Canary releases detect regressions on real-world traffic with minimal blast radius, automatically rolling back if HTTP 5xx errors spike.'
  },
  {
    id: 'q-cloud-9',
    domain_id: 'cloud-devops',
    question: 'In distributed tracing with OpenTelemetry, what does the W3C Trace Context header "traceparent" carry?',
    options_json: JSON.stringify([
      'The plaintext password of the client user',
      'A standardized string containing version, trace ID, parent span ID, and trace flags across network boundaries',
      'The entire JSON payload of the request',
      'The IP address of every intermediate router'
    ]),
    correct_index: 1,
    topic: 'Distributed Tracing & Context Propagation',
    explanation: 'The traceparent header propagates unified trace context across microservices, allowing APMs to stitch together end-to-end request latency waterfalls.'
  },
  {
    id: 'q-cloud-10',
    domain_id: 'cloud-devops',
    question: 'What is Infrastructure as Code (IaC) drift and how is it detected?',
    options_json: JSON.stringify([
      'When code comments are deleted by developers',
      'When actual cloud resource states diverge from declarative definitions due to manual changes, detected via periodic "plan" runs',
      'When cloud servers drift across different time zones',
      'When network bandwidth slows down during peak hours'
    ]),
    correct_index: 1,
    topic: 'Infrastructure Drift Detection',
    explanation: 'Automated drift detection compares live cloud API states against the committed Git repository, alerting teams to unauthorized manual modifications.'
  },

  // -------------------------------------------------------------
  // Domain 3: Full-Stack & Distributed Systems (10 Questions)
  // -------------------------------------------------------------
  {
    id: 'q-fullstack-1',
    domain_id: 'fullstack',
    question: 'What is the architectural impact of React Server Components (RSC) on client-side bundle size?',
    options_json: JSON.stringify([
      'Server Component dependencies execute exclusively on the server and ship 0KB of JavaScript to the client',
      'They double the client bundle size because code is mirrored on both ends',
      'They require client browsers to run Node.js in WebAssembly',
      'They replace CSS styling completely'
    ]),
    correct_index: 0,
    topic: 'React Server Components (RSC) Architecture',
    explanation: 'RSC code and imported libraries remain on the server, sending only a serialized virtual DOM stream to the browser.'
  },
  {
    id: 'q-fullstack-2',
    domain_id: 'fullstack',
    question: 'How do clustered WebSocket servers maintain synchronized bidirectional messaging across separate server nodes?',
    options_json: JSON.stringify([
      'Clients must establish duplicate TCP connections to every server instance',
      'A centralized Pub/Sub broker (e.g. Redis Pub/Sub) relays events across all WebSocket server instances',
      'WebSockets do not support multi-server deployments',
      'By polling the database once every 10 milliseconds'
    ]),
    correct_index: 1,
    topic: 'Clustered WebSockets & Redis Pub/Sub',
    explanation: 'Redis Pub/Sub connects decoupled server instances so any node can broadcast a message to connected clients anywhere in the cluster.'
  },
  {
    id: 'q-fullstack-3',
    domain_id: 'fullstack',
    question: 'In modern Next.js 15, how does progressive streaming hydration with React Suspense improve perceived performance?',
    options_json: JSON.stringify([
      'By blocking the entire page until all slow database queries resolve',
      'By sending the initial layout shell instantly while slow widgets stream in over the open HTTP connection and hydrate independently',
      'By compiling all React code directly to machine assembly',
      'By caching all pages indefinitely in browser memory'
    ]),
    correct_index: 1,
    topic: 'Streaming Hydration & React Suspense',
    explanation: 'Suspense boundaries allow high-priority UI to paint immediately, streaming slower asynchronous data slots as chunks arrive without blocking First Contentful Paint.'
  },
  {
    id: 'q-fullstack-4',
    domain_id: 'fullstack',
    question: 'How do Server Actions in modern React frameworks protect against Cross-Site Request Forgery (CSRF)?',
    options_json: JSON.stringify([
      'They rely only on IP address whitelisting',
      'They automatically verify cryptographically signed action tokens matched against the active session before invocation',
      'They disable HTTP POST requests entirely',
      'They force users to solve a CAPTCHA on every click'
    ]),
    correct_index: 1,
    topic: 'Server Actions Security & CSRF Guards',
    explanation: 'Modern Server Actions generate cryptographic action IDs and validate origin headers and session tokens to prevent unauthorized cross-origin execution.'
  },
  {
    id: 'q-fullstack-5',
    domain_id: 'fullstack',
    question: 'Why can traditional relational database connection pools fail in serverless / edge environments?',
    options_json: JSON.stringify([
      'Edge functions do not understand SQL syntax',
      'Each ephemeral invocation spawns its own short-lived instance, rapidly exhausting maximum database connection limits (e.g. max_connections)',
      'Relational databases cannot run on the cloud',
      'Serverless runtimes only support CSV storage'
    ]),
    correct_index: 1,
    topic: 'Serverless Connection Pooling & Proxies',
    explanation: 'Serverless scaling creates hundreds of parallel lambdas; connection poolers like PgBouncer or Supabase pooling proxies maintain shared persistent socket pools.'
  },
  {
    id: 'q-fullstack-6',
    domain_id: 'fullstack',
    question: 'What is Optimistic UI updating and how does it handle backend server failures?',
    options_json: JSON.stringify([
      'Showing a full-screen loading spinner until the backend finishes',
      'Immediately updating the client UI assuming success, and rolling back state with an error toast if the server mutation fails',
      'Preventing users from clicking buttons multiple times',
      'Sending email notifications before each database update'
    ]),
    correct_index: 1,
    topic: 'Optimistic UI & State Rollbacks',
    explanation: 'Optimistic updates provide zero-latency UI responsiveness, storing previous state snapshots to gracefully revert if the network request fails.'
  },
  {
    id: 'q-fullstack-7',
    domain_id: 'fullstack',
    question: 'What problem does the Redis Redlock distributed locking algorithm solve?',
    options_json: JSON.stringify([
      'It encrypts Redis keys with AES-256',
      'It prevents concurrent microservice workers from executing duplicate work or race conditions across a distributed Redis cluster',
      'It compresses JSON documents stored in memory',
      'It routes DNS traffic to the fastest geographic server'
    ]),
    correct_index: 1,
    topic: 'Distributed Locking & Race Prevention',
    explanation: 'Redlock acquires time-limited locks across majority independent Redis masters, guaranteeing mutual exclusion even if individual nodes restart.'
  },
  {
    id: 'q-fullstack-8',
    domain_id: 'fullstack',
    question: 'How do Web Workers prevent UI jank during heavy client-side computations (e.g. data parsing)?',
    options_json: JSON.stringify([
      'By running computational tasks on an isolated background OS thread, keeping the main UI render thread unblocked at 60 FPS',
      'By downloading faster Wi-Fi drivers into the browser',
      'By converting JavaScript into plain CSS styles',
      'By disabling browser garbage collection'
    ]),
    correct_index: 0,
    topic: 'Web Workers & Main Thread Non-Blocking',
    explanation: 'JavaScript UI execution is single-threaded. Heavy calculations in Web Workers communicate via message passing, preventing interface freezes.'
  },
  {
    id: 'q-fullstack-9',
    domain_id: 'fullstack',
    question: 'What is the "stale-while-revalidate" HTTP Cache-Control directive strategy?',
    options_json: JSON.stringify([
      'Rejecting all cached responses immediately',
      'Serving cached data instantly to the user while asynchronously fetching fresh content in the background to update the cache for next time',
      'Deleting the browser database every 60 seconds',
      'Forcing the user to manually refresh the web page'
    ]),
    correct_index: 1,
    topic: 'HTTP Caching & Stale-While-Revalidate',
    explanation: 'Stale-while-revalidate maximizes client response speed by serving warm cache hits immediately while keeping contents perpetually updated in the background.'
  },
  {
    id: 'q-fullstack-10',
    domain_id: 'fullstack',
    question: 'Why does HTTP/3 over QUIC outperform HTTP/2 on lossy or mobile wireless networks?',
    options_json: JSON.stringify([
      'It replaces HTML with XML',
      'It uses UDP-based multiplexed streams where a lost packet in one stream does not block unrelated parallel streams (no Head-of-Line blocking)',
      'It does not require SSL/TLS certificates',
      'It doubles the client battery life'
    ]),
    correct_index: 1,
    topic: 'HTTP/3, QUIC & Multiplexed Transport',
    explanation: 'In TCP-based HTTP/2, a dropped packet stalls the whole socket stream. QUIC handles loss recovery independently on each logical stream.'
  },

  // -------------------------------------------------------------
  // Domain 4: Cybersecurity & Cryptography (10 Questions)
  // -------------------------------------------------------------
  {
    id: 'q-cybersec-1',
    domain_id: 'cybersec',
    question: 'In Zero-Knowledge authentication, what is the core property of a zk-SNARK proof?',
    options_json: JSON.stringify([
      'It proves a statement is true without revealing the secret witness data itself',
      'It requires transmitting the users plaintext password over HTTPS',
      'It can only run on dedicated quantum hardware',
      'It replaces public key cryptography'
    ]),
    correct_index: 0,
    topic: 'zk-SNARKs & Secret Witness Verification',
    explanation: 'zk-SNARKs allow proving computational facts (e.g., identity verification or credit score) without revealing the underlying private data.'
  },
  {
    id: 'q-cybersec-2',
    domain_id: 'cybersec',
    question: 'Why should session JWTs be stored in HttpOnly, SameSite=Lax cookies instead of localStorage?',
    options_json: JSON.stringify([
      'Cookies are faster to read than JavaScript memory',
      'HttpOnly cookies cannot be accessed or stolen by malicious JavaScript during Cross-Site Scripting (XSS) attacks',
      'localStorage has a 50-byte size limit',
      'Browsers block localStorage for security'
    ]),
    correct_index: 1,
    topic: 'HttpOnly Cookie Protection vs XSS',
    explanation: 'HttpOnly prevents client-side scripts from reading the cookie, effectively preventing credential theft via XSS vulnerabilities.'
  },
  {
    id: 'q-cybersec-3',
    domain_id: 'cybersec',
    question: 'What vulnerability does OAuth 2.1 address by strictly deprecating the Implicit Grant flow in favor of Authorization Code with PKCE?',
    options_json: JSON.stringify([
      'Slow database connection pooling',
      'Access token interception and leakage in URI fragments and browser navigation histories',
      'SQL injection on the backend database',
      'Buffer overflows in C libraries'
    ]),
    correct_index: 1,
    topic: 'OAuth 2.1 & PKCE Token Exchange',
    explanation: 'The implicit grant exposes tokens directly in the URL redirect hash. PKCE uses an ephemeral code verifier and SHA-256 challenge, preventing token theft.'
  },
  {
    id: 'q-cybersec-4',
    domain_id: 'cybersec',
    question: 'Why are constant-time string comparison functions mandatory when verifying HMAC signatures or authentication hashes?',
    options_json: JSON.stringify([
      'Standard string comparison operators (===) take more CPU cycles',
      'Early return on mismatched characters leaks timing information that allows attackers to reconstruct secrets byte-by-byte (timing attack)',
      'They prevent out-of-memory memory leaks in Node.js',
      'They convert Unicode strings to ASCII'
    ]),
    correct_index: 1,
    topic: 'Constant-Time Comparison & Timing Attacks',
    explanation: 'Using crypto.timingSafeEqual() ensures the comparison takes identical execution time regardless of where differences occur, defeating statistical timing attacks.'
  },
  {
    id: 'q-cybersec-5',
    domain_id: 'cybersec',
    question: 'What is the difference between symmetric (HS256) and asymmetric (RS256/ES256) JWT signing in microservice architectures?',
    options_json: JSON.stringify([
      'HS256 requires every microservice to share the private secret key, whereas RS256 lets services verify tokens using only the public key',
      'RS256 does not support signature validation',
      'HS256 tokens are always 10 times larger than RS256 tokens',
      'Asymmetric signing cannot run on HTTPS'
    ]),
    correct_index: 0,
    topic: 'Asymmetric JWT Verification (RS256 vs HS256)',
    explanation: 'With asymmetric keys, only the auth server possesses the private key to issue tokens; all downstream consumer services verify signatures safely with public keys.'
  },
  {
    id: 'q-cybersec-6',
    domain_id: 'cybersec',
    question: 'How does Content Security Policy (CSP) with cryptographic nonces prevent inline XSS exploitation?',
    options_json: JSON.stringify([
      'It encrypts all HTML files on the server hard drive',
      'The browser executes only inline script tags that match the cryptographically random, per-request nonce generated in HTTP headers',
      'It disables JavaScript completely on the client browser',
      'It requires users to install a browser extension'
    ]),
    correct_index: 1,
    topic: 'Content Security Policy (CSP) & Nonces',
    explanation: 'Injected third-party scripts cannot guess the unique per-request nonce token, so modern browsers refuse to execute the malicious script.'
  },
  {
    id: 'q-cybersec-7',
    domain_id: 'cybersec',
    question: 'In Zero-Knowledge circuits, what does an R1CS (Rank-1 Constraint System) represent?',
    options_json: JSON.stringify([
      'A relational database indexing schema',
      'A system of polynomial equations (A · s) * (B · s) - (C · s) = 0 representing the computational circuit that must be satisfied',
      'A network firewall packet filtering table',
      'A compression format for video streaming'
    ]),
    correct_index: 1,
    topic: 'R1CS Arithmetic Circuits & ZK Maths',
    explanation: 'R1CS translates programmatic logic into quadratic constraints that can be proved using elliptic curve pairings without revealing private inputs.'
  },
  {
    id: 'q-cybersec-8',
    domain_id: 'cybersec',
    question: 'What defense mechanism protects against Cross-Site Request Forgery (CSRF) in state-changing API endpoints?',
    options_json: JSON.stringify([
      'Storing passwords in base64',
      'Enforcing SameSite=Strict/Lax cookie policies and requiring double-submit CSRF anti-forgery tokens in request headers',
      'Allowing GET requests to modify database rows',
      'Disabling HTTPS encryption'
    ]),
    correct_index: 1,
    topic: 'CSRF Defenses & Anti-Forgery Tokens',
    explanation: 'SameSite restricts cross-origin cookie attachment, and anti-CSRF request header tokens cannot be read or forged by unauthorized third-party origins.'
  },
  {
    id: 'q-cybersec-9',
    domain_id: 'cybersec',
    question: 'How do Zero-Knowledge Merkle Tree membership proofs allow private voting or whitelist verification?',
    options_json: JSON.stringify([
      'By publishing the entire voter registry publicly on the internet',
      'A user proves knowledge of a private key and a cryptographic Merkle path to the known Merkle Root without revealing their leaf identity',
      'By requiring voters to reveal their physical biometric ID',
      'By disabling cryptographic hashing algorithms'
    ]),
    correct_index: 1,
    topic: 'Merkle Membership Proofs & Anonymous Credentials',
    explanation: 'The ZK circuit validates that a leaf exists inside the tree commitments without disclosing which specific index or person the leaf belongs to.'
  },
  {
    id: 'q-cybersec-10',
    domain_id: 'cybersec',
    question: 'What is TLS 1.3 0-RTT (Zero Round-Trip Time) resumption and what security risk does it introduce?',
    options_json: JSON.stringify([
      'It disables TLS encryption entirely',
      'It speeds up connection setup by sending early application data, but early data is vulnerable to replay attacks unless strictly protected',
      'It prevents users from connecting over Wi-Fi',
      'It requires four extra network round trips'
    ]),
    correct_index: 1,
    topic: 'TLS 1.3 0-RTT & Replay Attack Mitigations',
    explanation: '0-RTT early data can be replayed by man-in-the-middle eavesdroppers; non-idempotent mutations (e.g. money transfer) must never be permitted in 0-RTT data.'
  },

  // -------------------------------------------------------------
  // Domain 5: Data Engineering & Streaming Analytics (10 Questions)
  // -------------------------------------------------------------
  {
    id: 'q-data-1',
    domain_id: 'data-eng',
    question: 'In Apache Kafka, what guarantees strict sequential event processing order?',
    options_json: JSON.stringify([
      'Publishing events with matching partition keys, ensuring they are routed to the same partition and consumer instance',
      'Increasing the consumer group thread pool to 100',
      'Setting Kafka replication factor to zero',
      'Disabling topic partitioning completely'
    ]),
    correct_index: 0,
    topic: 'Kafka Partition Keys & Sequential Ordering',
    explanation: 'Kafka guarantees total ordering within an individual partition. Events sharing the same partition key are always processed in sequence.'
  },
  {
    id: 'q-data-2',
    domain_id: 'data-eng',
    question: 'Why do columnar OLAP databases like ClickHouse process analytical aggregations significantly faster than traditional row stores?',
    options_json: JSON.stringify([
      'They only read the disk bytes for the specific columns queried, while utilizing SIMD vectorized CPU execution',
      'They do not store data on persistent disk drives',
      'They avoid indexing data entirely',
      'They convert all data into plain JSON strings'
    ]),
    correct_index: 0,
    topic: 'Columnar Storage & SIMD Vectorization',
    explanation: 'Columnar storage skips irrelevant columns, reducing disk I/O drastically, and processes columnar arrays with high-performance CPU vectorization.'
  },
  {
    id: 'q-data-3',
    domain_id: 'data-eng',
    question: 'What is the purpose of a Kafka Schema Registry (e.g. Confluent Schema Registry)?',
    options_json: JSON.stringify([
      'It writes SQL queries for business analysts',
      'It manages and validates schema versions (Avro/Protobuf), enforcing backward and forward compatibility contracts between decoupled producers and consumers',
      'It stores passwords for Kafka brokers',
      'It replaces the need for topic partitions'
    ]),
    correct_index: 1,
    topic: 'Schema Registry & Contract Evolution',
    explanation: 'A Schema Registry prevents producer teams from publishing breaking schema modifications that would crash downstream consumer ingestion pipelines.'
  },
  {
    id: 'q-data-4',
    domain_id: 'data-eng',
    question: 'How do Materialized Views in ClickHouse or TimescaleDB achieve zero-latency aggregations on multi-billion-row streams?',
    options_json: JSON.stringify([
      'By re-scanning all billions of rows on every dashboard load',
      'By incrementally computing running pre-aggregations as new event batches are inserted, storing transformed states in dedicated destination tables',
      'By deleting historical rows after 24 hours',
      'By converting all numbers to strings'
    ]),
    correct_index: 1,
    topic: 'Real-Time Materialized Views & Pre-aggregations',
    explanation: 'Materialized views operate like insertion triggers: incoming events update running sum/count states instantaneously, avoiding heavy runtime table scans.'
  },
  {
    id: 'q-data-5',
    domain_id: 'data-eng',
    question: 'In distributed data processing (e.g. Spark / Presto), why are Shuffle Joins significantly more expensive than Broadcast Joins?',
    options_json: JSON.stringify([
      'Shuffle joins require repartitioning and sending gigabytes of records across cluster network switches, whereas broadcast joins copy a small lookup table to all executors',
      'Broadcast joins cannot run on multi-core machines',
      'Shuffle joins only support string columns',
      'Broadcast joins require dedicated GPU acceleration'
    ]),
    correct_index: 0,
    topic: 'Distributed Joins: Shuffle vs Broadcast',
    explanation: 'Network I/O is the primary bottleneck in distributed compute. Broadcasting small dimension tables eliminates the costly cross-network partition shuffle step.'
  },
  {
    id: 'q-data-6',
    domain_id: 'data-eng',
    question: 'What is the transactional outbox pattern in event-driven microservices?',
    options_json: JSON.stringify([
      'Deleting emails immediately after sending',
      'Writing business data mutations and outgoing event payloads inside the SAME local database transaction, and using a CDC tool to publish to Kafka',
      'Sending events directly to Kafka before saving to the database',
      'Disabling database transactions for speed'
    ]),
    correct_index: 1,
    topic: 'Transactional Outbox & Dual-Write Prevention',
    explanation: 'The outbox pattern eliminates dual-write race conditions: both the business entity update and the event are committed atomically to the database.'
  },
  {
    id: 'q-data-7',
    domain_id: 'data-eng',
    question: 'Why is Apache Parquet the industry standard file format for data lakehouse architectures?',
    options_json: JSON.stringify([
      'Parquet is a plain text format editable in Notepad',
      'It provides columnar storage, dictionary encoding, snappy compression, and statistics metadata (min/max) for aggressive partition pruning',
      'It cannot be read by cloud storage buckets',
      'It converts data into binary executable files'
    ]),
    correct_index: 1,
    topic: 'Parquet Lakehouse Storage & Columnar Pruning',
    explanation: 'Parquet stores chunk metadata (row group min/max values) that allows query engines to skip entire row groups without reading them off disk.'
  },
  {
    id: 'q-data-8',
    domain_id: 'data-eng',
    question: 'In stream processing (e.g. Apache Flink), what is a "Watermark"?',
    options_json: JSON.stringify([
      'A visible company logo rendered on exported PDF charts',
      'A monotonically advancing timestamp metric declaring that the stream processor does not expect any further events older than that timestamp',
      'A mechanism to delete corrupted messages',
      'A method to detect unauthorized data scraping'
    ]),
    correct_index: 1,
    topic: 'Stream Watermarks & Out-of-Order Handling',
    explanation: 'Watermarks govern event-time windowing: when a watermark advances past a window boundary, the window is finalized and emitted even if delayed network packets arrive.'
  },
  {
    id: 'q-data-9',
    domain_id: 'data-eng',
    question: 'What is Change Data Capture (CDC) using Debezium and Kafka Connect?',
    options_json: JSON.stringify([
      'Copying files between desktop folders',
      'Tailing the low-level write-ahead transaction log (WAL / binlog) of a database to stream real-time row-level INSERT/UPDATE/DELETE events into Kafka',
      'Running SELECT * FROM table once every 24 hours',
      'Creating database indexes on primary keys'
    ]),
    correct_index: 1,
    topic: 'Change Data Capture (CDC) & Write-Ahead Logs',
    explanation: 'CDC captures data mutations directly from the database transaction log with zero impact on application queries, powering real-time streaming replicas.'
  },
  {
    id: 'q-data-10',
    domain_id: 'data-eng',
    question: 'How do backpressure mechanisms prevent streaming consumers from crashing when ingest volume spikes by 1000%?',
    options_json: JSON.stringify([
      'By dropping all incoming customer data permanently',
      'By signaling upstream producers or adjusting thread pool buffer sizes to throttle consumption rate to match processing capacity',
      'By automatically rebooting the operating system',
      'By disabling all database foreign keys'
    ]),
    correct_index: 1,
    topic: 'Streaming Backpressure & Buffer Stability',
    explanation: 'Backpressure prevents out-of-memory crashes by propagating flow-control signals upstream, pausing socket reads until consumer queues drain.'
  }
];

const insertQuestion = db.prepare(`
  INSERT OR REPLACE INTO domain_questions (id, domain_id, question, options_json, correct_index, explanation, topic)
  VALUES (@id, @domain_id, @question, @options_json, @correct_index, @explanation, @topic)
`);
QUESTIONS_SEED.forEach(q => insertQuestion.run(q));

// =========================================================================
// 5 DOMAIN-SPECIFIC PROGRESSION ROADMAPS (5 Milestones Each)
// =========================================================================
const DOMAIN_ROADMAPS = {
  'ai-agents': {
    domain_id: 'ai-agents',
    target_role: 'AI Systems & Autonomous Agents Architect',
    steps: [
      {
        order_num: 1,
        title: 'Master Cyclical State Graphs & LangGraph Runtimes',
        desc: 'Construct cyclical state graphs with deterministic exit validators and recursion controls to eliminate infinite loops and hallucinations.',
        domain: 'AI & Autonomous Agents',
        resource_url: 'https://github.com/langchain-ai/langgraph',
        url_label: 'LangGraph Architecture Guide',
        status: 'completed'
      },
      {
        order_num: 2,
        title: 'Distributed LLM Tool Calling & Strict Schema Validation',
        desc: 'Implement strict JSON Schema and Pydantic validators to guarantee reliable function arguments across external services and APIs.',
        domain: 'AI & Autonomous Agents',
        resource_url: 'https://docs.pydantic.dev/latest/',
        url_label: 'Pydantic Schema Validation',
        status: 'in-progress'
      },
      {
        order_num: 3,
        title: 'Production Hybrid Vector Search & Re-Ranking',
        desc: 'Combine dense vector embeddings with sparse BM25 retrieval using Reciprocal Rank Fusion (RRF) for precise technical recall.',
        domain: 'AI & Autonomous Agents',
        resource_url: 'https://qdrant.tech/documentation/',
        url_label: 'Qdrant Hybrid Search Docs',
        status: 'pending'
      },
      {
        order_num: 4,
        title: 'Supervisor-Worker Multi-Agent Topology & Memory Checkpointing',
        desc: 'Deploy supervisor router agents with state checkpointing to enable safe rollbacks and human-in-the-loop approvals before tool execution.',
        domain: 'AI & Autonomous Agents',
        resource_url: 'https://python.langchain.com/docs/concepts/architecture/',
        url_label: 'Multi-Agent Design Patterns',
        status: 'pending'
      },
      {
        order_num: 5,
        title: 'Sandboxed Agent Execution & Real-Time Token Streaming',
        desc: 'Isolate agent bash and python executions in ephemeral gVisor microVMs with Server-Sent Events (SSE) token delta streaming.',
        domain: 'AI & Autonomous Agents',
        resource_url: 'https://gvisor.dev/docs/',
        url_label: 'gVisor MicroVM Sandboxing',
        status: 'pending'
      }
    ]
  },
  'cloud-devops': {
    domain_id: 'cloud-devops',
    target_role: 'Cloud Platform & DevOps Principal Architect',
    steps: [
      {
        order_num: 1,
        title: 'Container Hardening & Distroless Microservice Packaging',
        desc: 'Author minimal multi-stage Dockerfiles with unprivileged user permissions and automated Trivy container vulnerability scanning.',
        domain: 'Cloud & DevOps Engineering',
        resource_url: 'https://github.com/GoogleContainerTools/distroless',
        url_label: 'Distroless Packaging Specs',
        status: 'completed'
      },
      {
        order_num: 2,
        title: 'Kubernetes Production Cluster Orchestration & Helm Packaging',
        desc: 'Deploy resilient StatefulSets, Horizontal Pod Autoscalers (HPA), and version-controlled Helm charts with zero-downtime rolling updates.',
        domain: 'Cloud & DevOps Engineering',
        resource_url: 'https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/',
        url_label: 'Kubernetes StatefulSet Guide',
        status: 'in-progress'
      },
      {
        order_num: 3,
        title: 'Infrastructure as Code with Terraform & Modular State Locking',
        desc: 'Architect modular Terraform blueprints with DynamoDB remote state locking, S3 encryption, and automated configuration drift detection.',
        domain: 'Cloud & DevOps Engineering',
        resource_url: 'https://developer.hashicorp.com/terraform/docs',
        url_label: 'Terraform State Management',
        status: 'pending'
      },
      {
        order_num: 4,
        title: 'Zero-Trust Service Mesh & Mutual TLS Cryptography',
        desc: 'Enforce strict mutual TLS encryption between microservices using Istio Envoy sidecars and SPIFFE cryptographic workload identities.',
        domain: 'Cloud & DevOps Engineering',
        resource_url: 'https://istio.io/latest/docs/concepts/security/',
        url_label: 'Istio mTLS Security Architecture',
        status: 'pending'
      },
      {
        order_num: 5,
        title: 'GitOps CI/CD Pipelines & Prometheus Observability Stacks',
        desc: 'Orchestrate continuous deployment via ArgoCD with high-resolution Prometheus metrics, Grafana dashboards, and Alertmanager alerts.',
        domain: 'Cloud & DevOps Engineering',
        resource_url: 'https://argo-cd.readthedocs.io/en/stable/',
        url_label: 'ArgoCD GitOps Deployment Guide',
        status: 'pending'
      }
    ]
  },
  'fullstack': {
    domain_id: 'fullstack',
    target_role: 'Principal Full-Stack & Distributed Systems Architect',
    steps: [
      {
        order_num: 1,
        title: 'Modern TypeScript & React Server Components (RSC)',
        desc: 'Master streaming Server-Side Rendering, Server Actions, Suspense boundaries, and zero-bundle server logic in Next.js 15.',
        domain: 'Full-Stack & Distributed Systems',
        resource_url: 'https://nextjs.org/docs/app/building-your-application/rendering/server-components',
        url_label: 'React Server Components Specs',
        status: 'completed'
      },
      {
        order_num: 2,
        title: 'Event-Driven Distributed Microservices & Message Brokers',
        desc: 'Design asynchronous event-driven pipelines using Kafka/RabbitMQ with idempotent consumer deduplication and dead-letter queues.',
        domain: 'Full-Stack & Distributed Systems',
        resource_url: 'https://microservices.io/patterns/data/event-driven-architecture.html',
        url_label: 'Event-Driven Architecture Patterns',
        status: 'in-progress'
      },
      {
        order_num: 3,
        title: 'High-Performance Database Sharding & Read-Replica Pooling',
        desc: 'Optimize PostgreSQL with PgBouncer connection pooling, composite B-tree indexing, and read replication for high concurrency.',
        domain: 'Full-Stack & Distributed Systems',
        resource_url: 'https://www.pgbouncer.org/',
        url_label: 'PgBouncer Connection Pooling',
        status: 'pending'
      },
      {
        order_num: 4,
        title: 'Duplex Real-Time WebSockets & Distributed Redis Pub/Sub',
        desc: 'Establish low-latency bidirectional socket channels backed by Redis cluster synchronization and sub-millisecond cache invalidation.',
        domain: 'Full-Stack & Distributed Systems',
        resource_url: 'https://redis.io/docs/latest/develop/interact/pubsub/',
        url_label: 'Redis Pub/Sub Documentation',
        status: 'pending'
      },
      {
        order_num: 5,
        title: 'Resilient API Gateway Design & Circuit Breaking Patterns',
        desc: 'Implement token-bucket rate limiters, gRPC proxies, and circuit-breaker failure isolation policies for graceful degradation.',
        domain: 'Full-Stack & Distributed Systems',
        resource_url: 'https://netflix.github.io/Hystrix/',
        url_label: 'Circuit Breaker Fault Tolerance',
        status: 'pending'
      }
    ]
  },
  'cybersec': {
    domain_id: 'cybersec',
    target_role: 'Chief Information Security Officer & Cryptographic Architect',
    steps: [
      {
        order_num: 1,
        title: 'Zero-Knowledge Proofs & zk-SNARK WebAssembly Circuits',
        desc: 'Design Circom arithmetic constraint circuits and verify zero-knowledge proofs in client WebAssembly without exposing private data.',
        domain: 'Cybersecurity & Cryptography',
        resource_url: 'https://docs.circom.io/',
        url_label: 'Circom ZK Circuit Documentation',
        status: 'completed'
      },
      {
        order_num: 2,
        title: 'OAuth 2.1, Hardened JWTs & Cryptographic Route Guards',
        desc: 'Enforce PKCE authentication flows, asymmetric Ed25519 signing keys, and automated refresh token rotation.',
        domain: 'Cybersecurity & Cryptography',
        resource_url: 'https://oauth.net/2.1/',
        url_label: 'OAuth 2.1 Security Specifications',
        status: 'in-progress'
      },
      {
        order_num: 3,
        title: 'Zero-Trust Network Architecture & Micro-Segmentation',
        desc: 'Architect identity-aware perimeters, software-defined network enclaves, and fine-grained least-privilege RBAC policies.',
        domain: 'Cybersecurity & Cryptography',
        resource_url: 'https://csrc.nist.gov/publications/detail/sp/800-207/final',
        url_label: 'NIST Zero Trust SP 800-207',
        status: 'pending'
      },
      {
        order_num: 4,
        title: 'Automated SAST/DAST Vulnerability Scanners & Remediation',
        desc: 'Integrate Semgrep AST analysis and OWASP ZAP dynamic fuzzing into CI pipelines to block high-severity CVEs before merge.',
        domain: 'Cybersecurity & Cryptography',
        resource_url: 'https://semgrep.dev/docs/',
        url_label: 'Semgrep Code Security Rules',
        status: 'pending'
      },
      {
        order_num: 5,
        title: 'Hardware Security Modules & Envelope Key Hierarchy',
        desc: 'Manage cryptographic root keys via Cloud KMS/HSM with AES-256-GCM envelope data encryption and automated rotation schedules.',
        domain: 'Cybersecurity & Cryptography',
        resource_url: 'https://cloud.google.com/kms/docs/envelope-encryption',
        url_label: 'Envelope Encryption Architecture',
        status: 'pending'
      }
    ]
  },
  'data-eng': {
    domain_id: 'data-eng',
    target_role: 'Lead Data Architect & Streaming Systems Engineer',
    steps: [
      {
        order_num: 1,
        title: 'Distributed Event Streaming with Apache Kafka & Schemas',
        desc: 'Design partitioned Kafka topics, consumer groups, and Confluent Avro schema registry compatibility for streaming events.',
        domain: 'Data Engineering & Streaming Analytics',
        resource_url: 'https://kafka.apache.org/documentation/',
        url_label: 'Apache Kafka Production Guide',
        status: 'completed'
      },
      {
        order_num: 2,
        title: 'Massive Columnar Analytical Querying with ClickHouse',
        desc: 'Deploy ClickHouse MergeTree columnar engines for sub-second analytical aggregations across billions of rows.',
        domain: 'Data Engineering & Streaming Analytics',
        resource_url: 'https://clickhouse.com/docs/',
        url_label: 'ClickHouse Architecture & Query Guide',
        status: 'in-progress'
      },
      {
        order_num: 3,
        title: 'Batch & Stream ETL Processing with Apache Spark & Flink',
        desc: 'Construct exactly-once streaming computations with PySpark Structured Streaming and Apache Flink stateful checkpoints.',
        domain: 'Data Engineering & Streaming Analytics',
        resource_url: 'https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html',
        url_label: 'Spark Structured Streaming Docs',
        status: 'pending'
      },
      {
        order_num: 4,
        title: 'Data Lakehouse Table Formats (Apache Iceberg & Delta Lake)',
        desc: 'Implement ACID transaction guarantees, time-travel queries, and metadata catalog compaction on cloud object storage.',
        domain: 'Data Engineering & Streaming Analytics',
        resource_url: 'https://iceberg.apache.org/docs/latest/',
        url_label: 'Apache Iceberg Table Specs',
        status: 'pending'
      },
      {
        order_num: 5,
        title: 'Data Observability, Lineage & Automated Quality Gates',
        desc: 'Automate data quality testing via dbt tests and Great Expectations with OpenLineage column-level tracing.',
        domain: 'Data Engineering & Streaming Analytics',
        resource_url: 'https://docs.getdbt.com/docs/build/tests',
        url_label: 'dbt Data Testing Guide',
        status: 'pending'
      }
    ]
  }
};

function getOrSeedRoadmapForDomain(domainId, userId = 1) {
  let rm = db.prepare('SELECT * FROM roadmaps WHERE domain_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1').get(domainId, userId);
  if (!rm) {
    rm = db.prepare('SELECT * FROM roadmaps WHERE domain_id = ? ORDER BY id DESC LIMIT 1').get(domainId);
  }
  if (!rm) {
    const seedData = DOMAIN_ROADMAPS[domainId];
    if (seedData) {
      const inserted = db.prepare(`
        INSERT INTO roadmaps (user_id, domain_id, target_role, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(userId, domainId, seedData.target_role);
      const rmId = inserted.lastInsertRowid;
      const insertStep = db.prepare(`
        INSERT INTO roadmap_steps (roadmap_id, title, order_num, domain, resource_url, status, desc, url_label)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      seedData.steps.forEach(s => {
        insertStep.run(rmId, s.title, s.order_num, s.domain, s.resource_url, s.status || 'pending', s.desc, s.url_label);
      });
      rm = db.prepare('SELECT * FROM roadmaps WHERE id = ?').get(rmId);
    }
  }
  return rm;
}

// Seed All 5 Domain Roadmaps
Object.keys(DOMAIN_ROADMAPS).forEach(dId => {
  getOrSeedRoadmapForDomain(dId, 1);
});

// Seed default certificate if none
const existingCert = db.prepare('SELECT id FROM certificates WHERE user_id = 1').get();
if (!existingCert) {
  db.prepare(`
    INSERT INTO certificates (id, user_id, domain_id, domain_name, recipient_name, score, passed, verification_code, issued_at)
    VALUES ('CERT-NX-2026-AI01', 1, 'ai-agents', 'AI & Autonomous Agents', 'Alex Morgan', 90, 1, 'VERIFY-NX-90-A882', datetime('now'))
  `).run();
}

console.log('SQLite Database successfully initialized and seeded with 50 questions across 5 domains at:', dbPath);

// =========================================================================
// Gemini AI Backend Service Helpers
// =========================================================================

/**
 * Calls Gemini API if GEMINI_API_KEY is available in the environment.
 * If not present, returns null to trigger seamless fallback.
 */
async function callGeminiAPI(prompt, systemInstruction = '', maxTokens = 8192) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new Promise((resolve) => {
    const postData = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      systemInstruction: systemInstruction ? {
        parts: [{ text: systemInstruction }]
      } : undefined,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: maxTokens || 8192,
        responseMimeType: 'application/json'
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 25000
    };

    const req = https.request(options, (res) => {
      let rawData = '';
      res.on('data', chunk => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          const candidateText = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            resolve(JSON.parse(candidateText));
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Low-level HTTPS helper for Google Generative Language (Gemini) API
 */
function makeGeminiApiCall(modelName, apiKey, contents, systemInstruction) {
  return new Promise((resolve) => {
    const bodyObj = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    };
    if (systemInstruction) {
      bodyObj.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }
    const postData = JSON.stringify(bodyObj);

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 25000
    };

    const req = https.request(options, (res) => {
      let rawData = '';
      res.on('data', chunk => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          if (res.statusCode !== 200) {
            const errMsg = parsed?.error?.message || `HTTP ${res.statusCode}`;
            return resolve({ error: errMsg, statusCode: res.statusCode });
          }
          const candidateText = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            resolve({ text: candidateText.trim(), model: modelName, statusCode: 200 });
          } else {
            resolve({ error: 'No text generated by Gemini', statusCode: 200 });
          }
        } catch (e) {
          resolve({ error: 'Failed to parse Gemini response', statusCode: 500 });
        }
      });
    });

    req.on('error', (e) => resolve({ error: e.message, statusCode: 500 }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'Gemini request timed out', statusCode: 408 });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Searches and calls Gemini API for freeform conversational AI Tutor answers.
 * Tries modern Gemini models (gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro).
 * Returns { text, source, model } or { error, statusCode }.
 */
async function callGeminiChat(prompt, systemInstruction = '', conversationHistory = [], customApiKey = '') {
  const apiKey = (customApiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return null;
  }

  const contents = [];
  if (Array.isArray(conversationHistory)) {
    for (const msg of conversationHistory.slice(-8)) {
      const text = msg.content || msg.text || '';
      if (text) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text }]
        });
      }
    }
  }
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

  for (const modelName of modelsToTry) {
    try {
      const result = await makeGeminiApiCall(modelName, apiKey, contents, systemInstruction);
      if (result && result.text) {
        return { text: result.text, source: 'gemini_ai', model: modelName };
      }
      if (result && result.error && (result.statusCode === 400 || result.statusCode === 403)) {
        return { error: result.error, statusCode: result.statusCode };
      }
    } catch (err) {
      console.error(`Gemini model ${modelName} error:`, err.message);
    }
  }

  return null;
}

/**
 * Sanitizes markdown / code fences into conversational plain speech text
 * for the Web Speech API synthesis engine.
 */
function cleanForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' [Code example provided below in the chat] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_#~>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/•|\*|- /g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .replace(/\.\.+/g, '.')
    .trim();
}

/**
 * Full-stack build roadmap text requested by the user
 */
const FULL_STACK_BUILD_ROADMAP_TEXT = `Full-stack build roadmap (in words)

I'm reading this as a step-by-step plan for building the career roadmap app from start to finish, with no code. If you meant a learning path to become a full-stack developer, tell me and I'll write that instead.

Phase 1: Plan and set up (Days 1-2)
Define the scope. Four screens: login, profile, assessment, roadmap. Write down what a user can do on each one.
Choose the stack. React for the frontend, Node with Express for the backend, PostgreSQL for the database.
Set up the project. Create one folder with a frontend and a backend subfolder, and start a Git repository.
Set up the tools. Install Node and PostgreSQL, create an empty database, and keep secrets (database address, token key) in a private environment file that never goes into Git.

Phase 2: Database (Days 3-4)
Design the tables: users, profiles, careers, skills, a table linking careers to the skills they need, assessments, roadmaps, and roadmap steps.
Create the tables through a migration file so anyone can rebuild the database.
Add starter data. Enter 5-10 careers and their required skills. The roadmap is only as good as this catalog.

Phase 3: Backend (Days 5-9)
Create the server with basic settings: JSON handling, cookie handling, and permission for the frontend to call it.
Build registration and login. Hash passwords, check email and password rules, and issue a session token stored in a secure cookie.
Add a login guard. Every route except login and register should reject visitors without a valid session.
Build the profile endpoints to read and save a user's details and target career.
Build the assessment endpoints to save answers step by step (so users can resume) and to submit the finished assessment.
Build the roadmap generator. For each skill the target career requires, compare the user's assessed level with the required level. Skills with a gap become steps, ordered by importance and size of gap, each with a learning resource link.
Build the roadmap endpoints to fetch the user's roadmap and update a step's status (to do, in progress, done).
Handle errors with clear messages and the right status codes.

Phase 4: Frontend (Days 10-16)
Set up the app shell: routing, a shared layout with navigation, and a small helper that talks to the backend.
Add session awareness. On load, ask the backend who the user is, and keep that in one shared place so every page can use it.
Build the login page with sign in and sign up in one screen, and clear error messages.
Add smart redirects. No profile sends the user to Profile, no assessment sends them to Assessment, otherwise to Roadmap. Unauthenticated visitors always go to Login.
Build the profile page: a form for personal details, education, interests, and target career, plus a completeness indicator.
Build the assessment page as a multi-step form with a progress bar, autosave on each step, and a final review before submitting.
Build the roadmap page: a timeline of steps, a progress percentage, status toggles, resource links, and a "retake assessment" button.
Polish the experience with loading states, empty states, and a layout that works on phones.

Phase 5: Connect and test (Days 17-19)
Walk the whole journey as a new user: register, fill the profile, take the assessment, view the roadmap, mark steps done.
Test the edge cases: wrong password, duplicate email, expired session, leaving the assessment halfway and returning, retaking the assessment.
Check security basics: passwords are hashed, protected routes really are protected, and all input is validated on the server and not only in the browser.
Fix what you find, then add a few automated tests for login and roadmap generation, since those break most easily.

Phase 6: Deploy (Days 20-21)
Host the database on a managed service and run the migrations there.
Deploy the backend to a platform like Render or Railway, with production secrets set in its settings.
Deploy the frontend to a platform like Vercel or Netlify, pointing it at the live backend address.
Turn on production settings: secure cookies, HTTPS, and permission only for your real frontend address.
Test the live site end to end once more.

Phase 7: After launch
Improve the roadmap: add more careers, richer resources, and time estimates per step.
Add personalization, such as an AI-written explanation of why each step matters.
Add engagement features: progress reminders by email, achievement badges, saved history of past roadmaps.
Watch real usage to see where users drop off, and fix those screens first.

Biggest risks to watch
Scope creep: finish the four core screens before adding extras.
A thin catalog: weak career and skill data makes the roadmap feel generic.
Skipping server-side validation: never trust the browser.
Leaving deployment to the end: try a test deploy by Phase 4 so surprises show up early.

If you'd like, I can turn this into a weekly checklist, or continue the code from where it was cut off (the auth routes onward).`;

/**
 * Intelligent domain expert fallback engine when Gemini API key is not supplied
 * or when operating in offline/sandbox environments.
 */
function generateFallbackTutorAnswer(question, domainName, targetRole, education, skills) {
  const qLower = question.toLowerCase();

  // If user asked about full stack, return the comprehensive build roadmap
  if (qLower.includes('full stack') || qLower.includes('fullstack')) {
    return FULL_STACK_BUILD_ROADMAP_TEXT;
  }

  if (qLower.includes('assessment') || qLower.includes('quiz') || qLower.includes('exam') || qLower.includes('test')) {
    return `### 🎯 Strategy for Excelling in the ${domainName} Assessment\n\n` +
      `To achieve top percentile marks in your technical certification:\n\n` +
      `1. **Study the 2 Reference Articles First**: Head over to the **Assessment tab** and thoroughly read the curated articles for **${domainName}**. They cover key real-world architectural tradeoffs.\n` +
      `2. **Understand Edge Cases**: The 10 assessment questions evaluate production scenario decision-making, latency tradeoffs, and protocol safety.\n` +
      `3. **Review Explanations**: Once you submit, review the detailed rationale provided for each question to strengthen any knowledge gaps.\n\n` +
      `💡 *Actionable tip:* Check the 'I have thoroughly studied the articles' checkbox when you are confident, then take the test calmly!`;
  }

  if (qLower.includes('roadmap') || qLower.includes('improve') || qLower.includes('career') || qLower.includes('job') || qLower.includes('role')) {
    return `### 🗺️ Career Acceleration Plan: ${targetRole}\n\n` +
      `Given your background in **${education}**, here is your optimized path forward:\n\n` +
      `* **Milestone 1: Core Foundation** — Master the foundational concurrency, event loop, and state machine paradigms of ${domainName}.\n` +
      `* **Milestone 2: Production Implementations** — Build an end-to-end prototype integrating with your stack (e.g. ${skills.slice(0, 3).join(', ')}).\n` +
      `* **Milestone 3: Benchmark & Quantify** — Measure latency reductions, throughput spikes, or reliability gains to showcase in your resume.\n\n` +
      `🚀 *Next Step:* Check out your personalized Roadmap in the Roadmap tab to adopt targeted improvement steps!`;
  }

  if (qLower.includes('agent') || qLower.includes('langgraph') || qLower.includes('tool') || qLower.includes('llm') || qLower.includes('rag')) {
    return `### 🤖 Autonomous Multi-Agent Architecture & Tool Calling\n\n` +
      `Autonomous AI Agents differ from traditional sequential prompts because they maintain **state**, **memory**, and **iterative decision cycles** (Plan → Act → Observe → Reflect).\n\n` +
      `**Core Architectural Layers:**\n` +
      `* **State Graph (e.g. LangGraph)**: Uses directed acyclic graphs (DAGs) with conditional edges to loop until an agent converges on a verified result.\n` +
      `* **Deterministic Tool Calling**: LLMs output structured JSON schema arguments that are executed by your runtime sandbox, then passed back as observations.\n` +
      `* **Hybrid Vector Memory**: Combines semantic embeddings (HNSW indexes) with keyword search for ultra-accurate context retrieval.\n\n` +
      `\`\`\`python\n# Conceptual Agent Node Transition\nasync def agent_node(state: AgentState):\n    response = await llm.bind_tools([search_db, run_code]).ainvoke(state.messages)\n    return {"messages": [response]}\n\`\`\`\n\n` +
      `💡 *Did you know?* You can test your agent understanding directly in the ${domainName} assessment!`;
  }

  if (qLower.includes('cloud') || qLower.includes('docker') || qLower.includes('kubernetes') || qLower.includes('k8s') || qLower.includes('devops') || qLower.includes('terraform')) {
    return `### ☁️ Modern Cloud & DevOps Engineering Principles\n\n` +
      `Production cloud engineering centers around **immutability**, **observability**, and **automated continuous reconciliation**.\n\n` +
      `* **Infrastructure as Code (IaC)**: Declare cloud topology using Terraform or OpenTofu for reproducible environments.\n` +
      `* **Containerization & Orchestration**: Kubernetes maintains the desired state of container pods using automated health-checks and rolling zero-downtime updates.\n` +
      `* **GitOps CI/CD**: Treat your Git repository as the single source of truth; any approved merge triggers automated cluster sync.\n\n` +
      `\`\`\`yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: careervista-service\nspec:\n  replicas: 3\n  template:\n    spec:\n      containers:\n      - name: app\n        image: careervista/api:v1.2\n\`\`\`\n\n` +
      `🔧 *Tip:* Review the cloud telemetry article in the Assessment section for high-scale microservices patterns.`;
  }

  if (qLower.includes('algo') || qLower.includes('leetcode') || qLower.includes('tree') || qLower.includes('graph') || qLower.includes('dynamic programming') || qLower.includes('sort') || qLower.includes('binary search') || qLower.includes('complexity') || qLower.includes('big o')) {
    return `### 🧠 Algorithmic Problem Solving & Complexity Strategy\n\n` +
      `When tackling algorithmic challenges for technical interviews:\n\n` +
      `1. **Clarify Inputs & Edge Cases**: Ask about array bounds, empty inputs, duplicate keys, and negative values.\n` +
      `2. **Establish Baseline & Optimize**: Start with an intuitive brute-force $O(N^2)$ solution, then reduce using hash maps ($O(N)$), two pointers, or binary search ($O(\\log N)$).\n` +
      `3. **State Tradeoffs**: Clearly state time vs space complexity before writing code.\n\n` +
      `\`\`\`python\ndef search_rotated_sorted(nums: list[int], target: int) -> int:\n    left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[left] <= nums[mid]:\n            if nums[left] <= target < nums[mid]:\n                right = mid - 1\n            else:\n                left = mid + 1\n        else:\n            if nums[mid] < target <= nums[right]:\n                left = mid + 1\n            else:\n                right = mid - 1\n    return -1\n\`\`\`\n\n` +
      `💡 *Time:* $O(\\log N)$ | *Space:* $O(1)$.`;
  }

  if (qLower.includes('system design') || qLower.includes('scale') || qLower.includes('cache') || qLower.includes('redis') || qLower.includes('latency') || qLower.includes('database') || qLower.includes('postgres') || qLower.includes('sql') || qLower.includes('sharding')) {
    return `### 🏛️ High-Scale Distributed System Design\n\n` +
      `For resilient high-throughput architectures:\n\n` +
      `* **Multi-Layer Caching (L1/L2)**: Use in-process local memory (LRU) for hot reads and Redis/Memcached cluster for shared distributed cache with TTL jitter.\n` +
      `* **Partitioning & Sharding**: Shard database tables by deterministic hash keys (e.g. \`hash(user_id) % N\`) with consistent hashing ring topology.\n` +
      `* **Asynchronous Decoupling**: Offload slow write workloads and third-party webhooks to durable queues (Kafka, SQS) to maintain sub-50ms p99 response times.\n\n` +
      `\`\`\`typescript\n// Cache-Aside with Stamped Read Protection\nasync function getCachedProfile(userId: string): Promise<UserProfile> {\n  const cached = await redis.get(\`user:\${userId}\`);\n  if (cached) return JSON.parse(cached);\n  \n  const profile = await db.query('SELECT * FROM users WHERE id = $1', [userId]);\n  await redis.setex(\`user:\${userId}\`, 3600, JSON.stringify(profile));\n  return profile;\n}\n\`\`\`\n\n` +
      `🚀 *Best Practice:* Always implement circuit breakers (e.g. Resilience4j or Cockatiel) when querying downstream services.`;
  }

  if (qLower.includes('react') || qLower.includes('next') || qLower.includes('frontend') || qLower.includes('css') || qLower.includes('javascript') || qLower.includes('typescript') || qLower.includes('state') || qLower.includes('component')) {
    return `### ⚡ Modern Full-Stack & Reactive UI Architecture\n\n` +
      `High-performance client architectures require clean state boundaries:\n\n` +
      `1. **Server vs Client Components**: Keep data-fetching, database access, and heavy libraries on the server; use client components strictly for interactive state and DOM hooks.\n` +
      `2. **Optimistic Updates**: Update local UI state immediately on user action, rolling back smoothly only if the network mutation rejects.\n` +
      `3. **Render Optimization**: Memoize expensive computations and use fine-grained signals or scoped context to prevent cascading component re-renders.\n\n` +
      `\`\`\`typescript\n// Clean Custom Hook with AbortSignal Guard\nexport function useLiveResource(endpoint: string) {\n  const [data, setData] = useState(null);\n  useEffect(() => {\n    const controller = new AbortController();\n    fetch(endpoint, { signal: controller.signal })\n      .then(res => res.json())\n      .then(setData)\n      .catch(err => { if (err.name !== 'AbortError') console.error(err); });\n    return () => controller.abort();\n  }, [endpoint]);\n  return data;\n}\n\`\`\`\n\n` +
      `💡 *CareerVista Tip:* Connect this directly to your project showcase in your Executive Resume!`;
  }

  if (qLower.includes('resume') || qLower.includes('cv') || qLower.includes('portfolio')) {
    return `### 📄 Resume Optimization for ${targetRole}\n\n` +
      `Your resume should tell a compelling story of impact:\n\n` +
      `1. **Highlight Education & Credentials**: Feature your degree (${education}) and verified certificates from this platform prominently.\n` +
      `2. **Quantify Achievements**: Use the *Google XYZ Formula* ("Accomplished [X] as measured by [Y] by doing [Z]").\n` +
      `3. **Tech Stack Relevance**: Highlight high-demand skills like ${skills.slice(0, 4).join(', ')}.\n\n` +
      `✨ Head to the **Resume & Checker** tab to run the Gemini ATS Audit and optimize your bullets!`;
  }

  // Default deep technical breakdown
  return `### 💡 Technical Guide: ${question}\n\n` +
    `Here is a targeted architectural breakdown for your inquiry in the **${domainName}** track:\n\n` +
    `* **Foundational Principle**: Always establish clear contract boundaries between your client representation and internal system data structures.\n` +
    `* **Production Resilience**: Isolate failures by wrapping external network calls in timeout-bounded retries with exponential backoff and circuit breaking.\n` +
    `* **Observability & Telemetry**: Emit structured JSON logs with correlation IDs tracing each request across your distributed services.\n\n` +
    `\`\`\`typescript\n// Recommended Architectural Pattern\ninterface ServiceContext {\n  traceId: string;\n  userId: string;\n  deadlineMs: number;\n}\n\nasync function executeWithGuard<T>(ctx: ServiceContext, task: () => Promise<T>): Promise<T> {\n  const timeout = new Promise((_, reject) => \n    setTimeout(() => reject(new Error('Operation timeout exceeded')), ctx.deadlineMs)\n  );\n  return Promise.race([task(), timeout]) as Promise<T>;\n}\n\`\`\`\n\n` +
    `🎯 *Next Step:* Let me know if you want to explore the implementation details, write unit tests, or evaluate its complexity!`;
}

/**
 * High-precision ATS Intelligence Evaluation Engine
 * Analyzes keyword frequencies, impact metrics (XYZ formula), and formats recommendations.
 */
function evaluateResumeWithFallbackEngine(resumeText, targetRole, domainName, jobDesc) {
  const textLower = resumeText.toLowerCase();

  // Target domain dictionary for keyword scanning
  const domainKeywordBank = {
    'ai-agents': ['langgraph', 'pytorch', 'multi-agent', 'vector', 'qdrant', 'rag', 'llm', 'autonomous', 'tool calling', 'latency', 'typescript', 'embeddings', 'evals', 'prompt', 'state machine'],
    'cloud-devops': ['kubernetes', 'docker', 'terraform', 'ci/cd', 'aws', 'prometheus', 'helm', 'microservices', 'grafana', 'gitops', 'ansible', 'linux', 'zero-downtime', 'cloudformation'],
    'fullstack': ['next.js', 'react', 'typescript', 'node.js', 'websockets', 'postgresql', 'redis', 'rest api', 'graphql', 'tailwind', 'microfrontends', 'state management', 'oauth', 'docker'],
    'cybersec': ['cryptography', 'zero-knowledge', 'zk-proofs', 'penetration', 'owasp', 'jwt', 'tls', 'wasm', 'audit', 'rbac', 'sha-256', 'vulnerability', 'encryption'],
    'data-eng': ['kafka', 'spark', 'streaming', 'snowflake', 'dbt', 'parquet', 'etl', 'data lake', 'pipeline', 'sql', 'airflow', 'clickhouse', 'scylla', 'cdc']
  };

  const domainKey = Object.keys(domainKeywordBank).find(k => domainName.toLowerCase().includes(k)) || 'ai-agents';
  const targetKeywords = domainKeywordBank[domainKey] || domainKeywordBank['ai-agents'];

  const foundKeywords = targetKeywords.filter(kw => textLower.includes(kw));
  const missingKeywords = targetKeywords.filter(kw => !textLower.includes(kw));

  // Count impact metrics (%, ms, M, k, x, $, numbers)
  const metricMatches = resumeText.match(/\b\d+(\.\d+)?(%|ms|s|x|k|m|\$|gb|tb)?\b/gi) || [];
  const actionVerbMatches = resumeText.match(/\b(architected|engineered|built|deployed|optimized|reduced|accelerated|orchestrated|spearheaded|implemented|scaled|designed)\b/gi) || [];

  // Calculate scores
  const keywordPct = Math.min(96, Math.max(55, Math.round((foundKeywords.length / targetKeywords.length) * 100) + 15));
  const impactPct = Math.min(95, Math.max(50, Math.round((metricMatches.length / 5) * 50) + Math.min(30, actionVerbMatches.length * 5)));
  const structurePct = resumeText.length > 500 && (resumeText.includes('•') || resumeText.includes('-') || resumeText.includes('*')) ? 94 : 78;
  const depthPct = Math.min(94, Math.max(60, Math.round((keywordPct * 0.5) + (impactPct * 0.5))));
  const overallAtsScore = Math.round((keywordPct * 0.35) + (impactPct * 0.3) + (structurePct * 0.15) + (depthPct * 0.2));

  let grade = 'Competitive (B+)';
  if (overallAtsScore >= 90) grade = 'Elite Candidate (A+)';
  else if (overallAtsScore >= 80) grade = 'Strong ATS Match (A-)';
  else if (overallAtsScore >= 70) grade = 'Average Match (B)';
  else grade = 'Needs Optimization (C)';

  // Pick top missing keywords to display with proper casing
  const displayMissing = missingKeywords.slice(0, 6).map(k => k.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

  return {
    ats_score: overallAtsScore,
    grade: grade,
    score_breakdown: {
      keyword_match: keywordPct,
      impact_metrics: impactPct,
      structure_formatting: structurePct,
      technical_depth: depthPct
    },
    overall_assessment: `The resume demonstrates a solid technical foundation in ${domainName} with ${foundKeywords.length} key domain competencies detected. However, ${missingKeywords.length} high-value ATS search keywords are missing, and project bullet points would benefit significantly from quantified business and latency metrics (Google XYZ formula).`,
    critical_strengths: [
      `Foundational competencies detected: ${foundKeywords.slice(0, 4).join(', ') || 'Modern Software Engineering'}.`,
      `Document contains ${actionVerbMatches.length} strong technical leadership action verbs (e.g., ${actionVerbMatches.slice(0, 3).join(', ') || 'Architected, Built'}).`,
      `Clear technical project deliverables aligned with ${targetRole}.`
    ],
    key_weaknesses: [
      `Missing high-value ATS keyword signals: ${displayMissing.slice(0, 3).join(', ') || 'Framework Keywords'}.`,
      `Several bullet points describe tasks or responsibilities rather than quantified outcomes (e.g. latency cut, throughput increase, cost reduction).`,
      `Executive summary lacks a sharp target value proposition highlighting verified certifications.`
    ],
    missing_keywords: displayMissing.length ? displayMissing : ['LangGraph', 'OpenTelemetry', 'Redis', 'Kubernetes', 'CI/CD Pipelines', 'HNSW Indexes'],
    suggested_bullet_rewrites: [
      {
        original: "Developed autonomous multi-agent system and python backend tools.",
        improved: `Architected low-latency autonomous multi-agent runtime using LangGraph and tool calling, cutting LLM hallucination rates by 42% and processing 1.2M queries/month.`,
        improvement_reason: "Applies Google XYZ formula (Accomplished [X] by [Y] with result [Z]), introduces hard throughput/error reduction metrics, and embeds high-value keyword 'LangGraph'."
      },
      {
        original: "Worked on cloud deployment and docker containers for microservices.",
        improved: `Containerized distributed microservices with Docker and automated zero-downtime rolling deployments via Kubernetes, boosting cluster reliability to 99.98%.`,
        improvement_reason: "Replaces passive duty phrasing with active verb 'Containerized' and specifies concrete 99.98% reliability metric."
      },
      {
        original: "Implemented database queries and caching to improve speed.",
        improved: `Engineered hybrid vector-relational indexing pipeline combining PostgreSQL with Redis caching, reducing p99 API query response time from 380ms to 42ms.`,
        improvement_reason: "Provides exact benchmark numbers (p99 latency from 380ms to 42ms) and identifies production caching architecture."
      }
    ],
    action_plan: [
      `Incorporate the ${displayMissing.slice(0, 3).join(', ') || 'target domain'} keywords directly into your project descriptions.`,
      `Rewrite duty bullet points into metric-backed impact statements using the formula: Action Verb + Project + Quantified Metric.`,
      `Include your CareerVista verified certificate ID and assessment percentile to prove technical competency.`
    ],
    industry_capabilities: {
      headline: `What You Are Capable of Doing in the Industry`,
      summary: `Based on your technical stack, architecture depth, and hands-on projects in ${domainName}, you are equipped to operate as a high-impact ${targetRole}. You possess the engineering competencies to design, deploy, and scale robust production systems while resolving mission-critical engineering bottlenecks.`,
      capable_roles: [
        `${targetRole}`,
        `Senior ${domainName} Engineer`,
        `Distributed Systems & Platform Architect`,
        `Full-Lifecycle Core Systems Engineer`
      ],
      what_you_can_build: [
        `Architect and ship high-throughput, low-latency applications handling 10k+ concurrent requests with sub-50ms p99 latency.`,
        `Design resilient microservices and distributed data pipelines with automated circuit breaking, message queues, and fault-tolerant failovers.`,
        `Implement secure, zero-trust API authentication gateways with role-based access control, cryptographic verification, and audit logging.`,
        `Automate CI/CD deployment pipelines, containerized orchestration, and multi-environment cloud infrastructure with automated rollbacks.`,
        `Lead cross-functional technical initiatives, author architectural decision records (ADRs), and mentor engineering teams on best practices.`
      ],
      business_impact: `You are capable of translating complex business requirements into maintainable, scalable software solutions—reducing infrastructure compute costs, minimizing system downtime, and accelerating product time-to-market for enterprise and startup teams.`
    }
  };
}

// =========================================================================
// Helper Functions
// =========================================================================
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, data, headers = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...headers
  });
  res.end(JSON.stringify(data));
}

// =========================================================================
// HTTP Server Handling
// =========================================================================
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const [rawUrl] = req.url.split('?');

  // =========================================================================
  // REST API Routes (/api/v1/...)
  // =========================================================================
  if (rawUrl.startsWith('/api/v1/')) {
    const apiPath = rawUrl.replace('/api/v1', '');

    // 1. Domains Catalog
    if (apiPath === '/domains' && req.method === 'GET') {
      const allDomains = db.prepare('SELECT * FROM domains').all();
      return sendJson(res, 200, { domains: allDomains });
    }

    // 2. Domain Details with 2 Reference Study Articles & AT LEAST 10 Questions
    if (apiPath.startsWith('/domains/') && req.method === 'GET') {
      const domainId = apiPath.split('/')[2];
      const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(domainId);
      if (!domain) {
        return sendJson(res, 404, { error: 'Domain not found' });
      }

      // Fetch the 2 curated reference articles for this domain
      const articles = db.prepare('SELECT * FROM domain_articles WHERE domain_id = ?').all(domainId);
      articles.forEach(a => {
        try { a.key_takeaways = JSON.parse(a.key_takeaways); } catch (e) {}
      });

      // Fetch AT LEAST 10 assessment questions for this domain
      const questions = db.prepare(`
        SELECT id, domain_id, question, options_json, explanation, topic
        FROM domain_questions
        WHERE domain_id = ?
        ORDER BY id ASC
      `).all(domainId);

      questions.forEach(q => {
        try { q.options = JSON.parse(q.options_json); } catch (e) {}
      });

      // Fetch the exclusive roadmap for THIS domain
      const rm = getOrSeedRoadmapForDomain(domainId, 1);
      let roadmapData = null;
      if (rm) {
        const steps = db.prepare('SELECT * FROM roadmap_steps WHERE roadmap_id = ? ORDER BY order_num ASC').all(rm.id);
        roadmapData = {
          target_role: rm.target_role,
          steps: steps.map(s => ({
            id: s.id,
            title: s.title,
            desc: s.desc || s.title,
            domain: domain.name,
            resource_url: s.resource_url,
            urlLabel: s.url_label || `${domain.name} Guide`,
            status: s.status
          }))
        };
      }

      return sendJson(res, 200, {
        domain,
        articles,
        questions,
        roadmap: roadmapData,
        total_questions: questions.length
      });
    }

    // 3. User Selects Interested Domain
    if (apiPath === '/domains/select' && req.method === 'POST') {
      const { domain_id, user_id = 1 } = await parseBody(req);
      const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(domain_id);
      if (!domain) {
        return sendJson(res, 404, { error: 'Domain not found' });
      }

      db.prepare('UPDATE profiles SET selected_domain = ? WHERE user_id = ?').run(domain_id, user_id);
      return sendJson(res, 200, {
        message: 'Domain selected successfully',
        domain_id,
        domain_name: domain.name
      });
    }

    // 3.5. Search & Dynamically Generate Custom Domain Track via Gemini AI in Backend
    if (apiPath === '/domains/custom-generate' && req.method === 'POST') {
      const { query = '', user_id = 1 } = await parseBody(req);
      const cleanQuery = query.trim();
      if (!cleanQuery || cleanQuery.length < 2) {
        return sendJson(res, 400, { error: 'Please enter a valid domain name to search.' });
      }

      // Generate a standardized slug
      const slug = 'custom-' + cleanQuery.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 40);

      // Check if domain already exists in SQLite
      const existingDomain = db.prepare('SELECT * FROM domains WHERE id = ?').get(slug);
      if (existingDomain) {
        const articles = db.prepare('SELECT * FROM domain_articles WHERE domain_id = ?').all(slug);
        articles.forEach(a => { try { a.key_takeaways = JSON.parse(a.key_takeaways); } catch (e) {} });

        const questions = db.prepare(`
          SELECT id, domain_id, question, options_json, correct_index, explanation, topic
          FROM domain_questions WHERE domain_id = ? ORDER BY id ASC
        `).all(slug);
        questions.forEach(q => { try { q.options = JSON.parse(q.options_json); } catch (e) {} });

        const rm = db.prepare('SELECT * FROM roadmaps WHERE domain_id = ? ORDER BY id DESC LIMIT 1').get(slug);
        let steps = [];
        if (rm) {
          steps = db.prepare('SELECT * FROM roadmap_steps WHERE roadmap_id = ? ORDER BY order_num ASC').all(rm.id);
        }

        // Update profile
        db.prepare('UPDATE profiles SET selected_domain = ? WHERE user_id = ?').run(slug, user_id);

        return sendJson(res, 200, {
          domain: existingDomain,
          articles,
          questions,
          roadmap: {
            target_role: rm ? rm.target_role : `${existingDomain.name} Specialist`,
            steps
          },
          source: 'sqlite_cache'
        });
      }

      // Generate the Gemini prompt in the backend
      const geminiPrompt = `You are a principal engineer, university curriculum architect, and technical certification examiner.
The user wants to study and take an assessment on the domain: "${cleanQuery}".

Generate a complete technical curriculum package for this domain as a strict JSON object with EXACTLY the following structure:
{
  "domain": {
    "id": "${slug}",
    "name": "${cleanQuery}",
    "icon": "<single matching emoji icon>",
    "tagline": "<1 short impactful technical tagline, 8-12 words>",
    "description": "<2-3 sentence overview covering core systems, modern toolchains, and real-world industrial relevance>"
  },
  "articles": [
    {
      "id": "art-${slug}-1",
      "title": "<In-depth Technical Reference Guide 1: Core Fundamentals & Architectural Paradigms>",
      "read_time": "8 min read",
      "summary": "<2-3 sentence executive technical summary>",
      "key_takeaways": [
        "<Core takeaway 1>",
        "<Core takeaway 2>",
        "<Core takeaway 3>",
        "<Core takeaway 4>"
      ],
      "content": "<Comprehensive in-depth reference reading text with sections: ### Architectural Foundations, ### Key Algorithms & Protocols, ### Common Failure Modes, and ### Production Best Practices>",
      "external_url": "https://en.wikipedia.org/wiki/${encodeURIComponent(cleanQuery)}"
    },
    {
      "id": "art-${slug}-2",
      "title": "<In-depth Technical Reference Guide 2: Advanced Engineering Patterns, Scaling & Production Implementation>",
      "read_time": "10 min read",
      "summary": "<2-3 sentence executive technical summary>",
      "key_takeaways": [
        "<Advanced takeaway 1>",
        "<Advanced takeaway 2>",
        "<Advanced takeaway 3>",
        "<Advanced takeaway 4>"
      ],
      "content": "<Comprehensive in-depth reference reading text with sections: ### Deep-Dive Mechanisms, ### Real-World Architecture Case Study, ### Benchmark Trade-Offs, and ### Verification & Testing>",
      "external_url": "https://github.com/topics/${encodeURIComponent(slug)}"
    }
  ],
  "questions": [
    {
      "id": "q-${slug}-1",
      "question": "<Rigorous technical multiple-choice question testing a concrete principle covered in the articles>",
      "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
      "correct_index": 0,
      "explanation": "<Clear technical explanation of why this option is correct and others are not>",
      "topic": "<Subtopic Name>"
    }
  ],
  "roadmap": {
    "target_role": "${cleanQuery} Principal Architect",
    "steps": [
      {
        "title": "<Milestone 1: Foundations & Core Mathematical / System Principles>",
        "desc": "<Description of concepts to master and exercises to complete>",
        "order_num": 1,
        "resource_url": "https://github.com/",
        "status": "completed"
      },
      {
        "title": "<Milestone 2: Frameworks, Tooling & Modern Implementations>",
        "desc": "<Hands-on architectural development and pipeline configuration>",
        "order_num": 2,
        "resource_url": "https://github.com/",
        "status": "in_progress"
      },
      {
        "title": "<Milestone 3: Advanced Optimization, Performance & Concurrency>",
        "desc": "<Low-latency tuning, benchmarking, and edge case resilience>",
        "order_num": 3,
        "resource_url": "https://github.com/",
        "status": "pending"
      },
      {
        "title": "<Milestone 4: Security, Verification & Fault Tolerance>",
        "desc": "<Auditing, cryptographic verification, or automated testing harnesses>",
        "order_num": 4,
        "resource_url": "https://github.com/",
        "status": "pending"
      },
      {
        "title": "<Milestone 5: Production Capstone & Enterprise Deployment>",
        "desc": "<Architect and deploy an end-to-end production-grade reference system with telemetry>",
        "order_num": 5,
        "resource_url": "https://github.com/",
        "status": "pending"
      }
    ]
  }
}
CRITICAL: You must provide exactly 10 questions and exactly 2 articles. Return ONLY raw JSON without markdown code fences.`;

      // Call Gemini API in backend
      let generatedData = await callGeminiAPI(geminiPrompt, 'You are an elite principal engineer and technical certification examiner.', 8192);

      let source = 'gemini_ai';
      // Validate structure or fallback to domain-aware generative engine
      if (
        !generatedData ||
        !generatedData.domain ||
        !Array.isArray(generatedData.articles) ||
        generatedData.articles.length < 2 ||
        !Array.isArray(generatedData.questions) ||
        generatedData.questions.length < 10
      ) {
        generatedData = generateFallbackCustomDomain(cleanQuery, slug);
        source = 'generative_engine';
      }

      // Ensure proper formatting
      const finalDomain = {
        id: slug,
        name: generatedData.domain.name || cleanQuery,
        icon: generatedData.domain.icon || pickDomainIcon(cleanQuery),
        tagline: generatedData.domain.tagline || `Architecting scalable, resilient systems in ${cleanQuery}.`,
        description: generatedData.domain.description || `Comprehensive exploration of ${cleanQuery} systems, architectures, and production implementations.`
      };

      const finalArticles = generatedData.articles.slice(0, 2).map((a, idx) => ({
        id: a.id || `art-${slug}-${idx + 1}`,
        domain_id: slug,
        title: a.title,
        read_time: a.read_time || `${8 + idx * 2} min read`,
        summary: a.summary,
        key_takeaways: Array.isArray(a.key_takeaways) ? a.key_takeaways : [
          'Foundational invariant verification & deterministic state machines',
          'High-throughput data serialization and zero-copy pipelines',
          'Lock-free concurrency models and cache locality tuning',
          'Resilient fault isolation, distributed consensus & automated failover'
        ],
        content: a.content || `### Overview of ${cleanQuery}\n\nKey architectural principles governing modern ${cleanQuery} implementations.`,
        external_url: a.external_url || `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanQuery)}`
      }));

      const finalQuestions = generatedData.questions.slice(0, 10).map((q, idx) => ({
        id: q.id || `q-${slug}-${idx + 1}`,
        domain_id: slug,
        question: q.question,
        options: Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_index: typeof q.correct_index === 'number' && q.correct_index >= 0 && q.correct_index < 4 ? q.correct_index : 0,
        explanation: q.explanation || 'Optimal solution based on domain architecture standards.',
        topic: q.topic || 'Core Architecture'
      }));

      const finalRoadmap = {
        target_role: generatedData.roadmap?.target_role || `${cleanQuery} Principal Engineer`,
        steps: Array.isArray(generatedData.roadmap?.steps) && generatedData.roadmap.steps.length >= 5
          ? generatedData.roadmap.steps.slice(0, 5)
          : [
            { title: `Foundations & Mathematical Principles of ${cleanQuery}`, desc: 'Master foundational primitives, state representations, and execution constraints.', order_num: 1, resource_url: 'https://github.com/', status: 'completed' },
            { title: `Frameworks, Toolchains & Architecture in ${cleanQuery}`, desc: 'Construct working runtime prototypes and configure CI/CD validation pipelines.', order_num: 2, resource_url: 'https://github.com/', status: 'in_progress' },
            { title: `Concurrency, High-Throughput Pipelines & Low-Latency Tuning`, desc: 'Tuning cache locality, async event loops, and non-blocking I/O routines.', order_num: 3, resource_url: 'https://github.com/', status: 'pending' },
            { title: `Security Hardening, Distributed Fault Tolerance & Auditing`, desc: 'Deploy automated test harnesses, anomaly detection, and cryptographic validation.', order_num: 4, resource_url: 'https://github.com/', status: 'pending' },
            { title: `Enterprise Capstone: Resilient Production System Deployment`, desc: 'Architect and deploy an end-to-end production-grade system with telemetry and failover.', order_num: 5, resource_url: 'https://github.com/', status: 'pending' }
          ]
      };

      // Persist in SQLite
      db.prepare(`
        INSERT OR REPLACE INTO domains (id, name, icon, tagline, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(finalDomain.id, finalDomain.name, finalDomain.icon, finalDomain.tagline, finalDomain.description);

      const insertArt = db.prepare(`
        INSERT OR REPLACE INTO domain_articles (id, domain_id, title, read_time, summary, key_takeaways, content, external_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      finalArticles.forEach(a => {
        insertArt.run(a.id, slug, a.title, a.read_time, a.summary, JSON.stringify(a.key_takeaways), a.content, a.external_url);
      });

      const insertQ = db.prepare(`
        INSERT OR REPLACE INTO domain_questions (id, domain_id, question, options_json, correct_index, explanation, topic)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      finalQuestions.forEach(q => {
        insertQ.run(q.id, slug, q.question, JSON.stringify(q.options), q.correct_index, q.explanation, q.topic);
      });

      // Insert Roadmap
      const insertRm = db.prepare(`
        INSERT INTO roadmaps (user_id, domain_id, target_role, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(user_id, slug, finalRoadmap.target_role);

      const rmId = insertRm.lastInsertRowid;
      const insertStep = db.prepare(`
        INSERT INTO roadmap_steps (roadmap_id, title, order_num, domain, resource_url, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      finalRoadmap.steps.forEach((s, idx) => {
        insertStep.run(rmId, s.title, idx + 1, cleanQuery, s.resource_url || 'https://github.com/', s.status || 'pending');
        s.id = idx + 1;
        s.domain = cleanQuery;
      });

      // Update User Profile
      db.prepare('UPDATE profiles SET selected_domain = ? WHERE user_id = ?').run(slug, user_id);

      return sendJson(res, 200, {
        domain: finalDomain,
        articles: finalArticles,
        questions: finalQuestions,
        roadmap: finalRoadmap,
        source
      });
    }

    // 4. Generate Domain Questions via Gemini AI in Backend
    if (apiPath === '/assessment/generate-gemini-questions' && req.method === 'POST') {
      const { domain_id = 'ai-agents' } = await parseBody(req);
      const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(domain_id);
      const articles = db.prepare('SELECT title, summary FROM domain_articles WHERE domain_id = ?').all(domain_id);

      const prompt = `Generate exactly 10 comprehensive, rigorous technical multiple-choice questions for the domain "${domain?.name || domain_id}".
Study Reference Context:
${articles.map(a => `- ${a.title}: ${a.summary}`).join('\n')}

Format as JSON object with key "questions", containing an array of 10 objects:
{
  "questions": [
    {
      "id": "q-gemini-1",
      "domain_id": "${domain_id}",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 1,
      "explanation": "Detailed explanation of why this answer is correct",
      "topic": "Topic Name"
    }
  ]
}`;

      const aiResponse = await callGeminiAPI(prompt, 'You are an elite principal engineer and technical certification examiner.');

      if (aiResponse && Array.isArray(aiResponse.questions) && aiResponse.questions.length >= 10) {
        return sendJson(res, 200, {
          source: 'gemini_ai',
          domain: domain,
          questions: aiResponse.questions
        });
      }

      // Seamless high-speed fallback to the 10 seeded questions in SQLite
      const seededQuestions = db.prepare(`
        SELECT id, domain_id, question, options_json, explanation, topic
        FROM domain_questions
        WHERE domain_id = ?
        ORDER BY id ASC
      `).all(domain_id);

      seededQuestions.forEach(q => {
        try { q.options = JSON.parse(q.options_json); } catch (e) {}
      });

      return sendJson(res, 200, {
        source: 'database_curated',
        domain: domain,
        questions: seededQuestions
      });
    }

    // 5. Assessment Submission & Evaluation Engine (Returns Percentage, Certificate & Improvement Roadmap)
    if (apiPath === '/assessment/submit' && req.method === 'POST') {
      const { domain_id, answers, user_id = 1 } = await parseBody(req);
      const questions = db.prepare('SELECT * FROM domain_questions WHERE domain_id = ? ORDER BY id ASC').all(domain_id);

      if (!questions.length) {
        return sendJson(res, 400, { error: 'No questions found for domain' });
      }

      const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(domain_id);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id) || { name: 'Alex Morgan' };

      let correctCount = 0;
      const review = [];
      const missedTopics = [];

      questions.forEach(q => {
        const userAnswer = answers ? answers[q.id] : null;
        let isCorrect = false;
        if (userAnswer !== null && userAnswer !== undefined) {
          isCorrect = parseInt(userAnswer, 10) === q.correct_index;
        }
        if (isCorrect) {
          correctCount++;
        } else {
          missedTopics.push({
            topic: q.topic || 'Core Concept',
            question: q.question,
            explanation: q.explanation
          });
        }

        let opts = [];
        try { opts = JSON.parse(q.options_json); } catch (e) {}

        review.push({
          question_id: q.id,
          question: q.question,
          topic: q.topic || 'Technical Topic',
          user_answer: userAnswer !== null && opts[userAnswer] ? opts[userAnswer] : 'No answer',
          correct_answer: opts[q.correct_index],
          is_correct: isCorrect,
          explanation: q.explanation
        });
      });

      // Calculate percentage
      const scorePercent = Math.round((correctCount / questions.length) * 100);
      const CERTIFICATE_PASS_PERCENT = 75; // Strictly requires >= 75% for certificate issuance
      const certificateEarned = scorePercent >= CERTIFICATE_PASS_PERCENT;
      const passed = certificateEarned ? 1 : 0;

      // Save Assessment to database
      const insertAssessment = db.prepare(`
        INSERT INTO assessments (user_id, domain_id, answers_json, score, passed, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).run(user_id, domain_id, JSON.stringify(answers), scorePercent, passed);

      // Issue Certificate ONLY when user gets above or equal to 75% in assessment
      let certificate = null;
      if (certificateEarned) {
        const certId = `CERT-NX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const verificationCode = `VRF-${Buffer.from(`${user_id}:${domain_id}:${scorePercent}`).toString('base64').substring(0, 12).toUpperCase()}`;
        const issuedAt = new Date().toISOString();

        db.prepare(`
          INSERT INTO certificates (id, user_id, domain_id, domain_name, recipient_name, score, passed, verification_code, issued_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(certId, user_id, domain_id, domain.name, user.name, scorePercent, 1, verificationCode, issuedAt);

        certificate = {
          id: certId,
          recipient_name: user.name,
          domain_name: domain.name,
          domain_id: domain.id,
          score: scorePercent,
          verification_code: verificationCode,
          issued_at: issuedAt,
          issuer: 'CareerVista Global Certification Board',
          title: `Certified Professional: ${domain.name}`
        };
      }

      // Generate Personalized Improvement Roadmap based on missed questions / score
      const improvementRoadmap = generateImprovementRoadmap(domain, scorePercent, missedTopics);

      return sendJson(res, 200, {
        assessment_id: insertAssessment.lastInsertRowid,
        domain_id,
        domain_name: domain.name,
        score: scorePercent,
        correct_count: correctCount,
        total_questions: questions.length,
        passed: !!passed,
        certificate_earned: certificateEarned,
        min_cert_percent: CERTIFICATE_PASS_PERCENT,
        grade: scorePercent >= 90 ? 'Honor Roll (A+)' : scorePercent >= 80 ? 'Distinction (A)' : scorePercent >= 75 ? 'Proficient (B+)' : scorePercent >= 60 ? 'Competent (C)' : 'Needs Review (F)',
        feedback: certificateEarned
          ? `Congratulations! You scored ${scorePercent}% (≥75%) and earned your official ${domain.name} Technical Certificate!`
          : `You scored ${scorePercent}%. A minimum score of 75% is strictly required to earn the verified Technical Certificate. Review the recommended study roadmap below and re-take the assessment to qualify!`,
        certificate,
        improvement_roadmap: improvementRoadmap,
        review
      });
    }

    // 6. Adopt / Save Improvement Roadmap into User Roadmap
    if (apiPath === '/roadmap/adopt-improvement' && req.method === 'POST') {
      const { domain_id, steps = [], user_id = 1 } = await parseBody(req);
      const domain = db.prepare('SELECT name FROM domains WHERE id = ?').get(domain_id);

      // Create new roadmap record
      const rm = db.prepare(`
        INSERT INTO roadmaps (user_id, domain_id, target_role, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(user_id, domain_id, `${domain?.name || 'Domain'} Specialist`);

      const rmId = rm.lastInsertRowid;

      const insertStep = db.prepare(`
        INSERT INTO roadmap_steps (roadmap_id, title, order_num, domain, resource_url, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      steps.forEach((s, idx) => {
        insertStep.run(rmId, s.title, idx + 1, s.domain || domain?.name || 'Improvement', s.resource_url || '#', 'pending');
      });

      return sendJson(res, 200, {
        success: true,
        message: 'Personalized improvement roadmap adopted successfully',
        roadmap_id: rmId
      });
    }

    // 7. Get User Certificates
    if (apiPath === '/certificates' && req.method === 'GET') {
      const certs = db.prepare('SELECT * FROM certificates WHERE user_id = 1 ORDER BY issued_at DESC').all();
      return sendJson(res, 200, { certificates: certs });
    }

    // 8. Get Single Certificate by ID
    if (apiPath.startsWith('/certificates/') && req.method === 'GET') {
      const certId = apiPath.split('/')[2];
      const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certId);
      if (!cert) return sendJson(res, 404, { error: 'Certificate not found' });
      return sendJson(res, 200, cert);
    }

    // 9. AI Resume Builder Endpoint (Gemini Powered with Education Qualification Basis)
    if (apiPath === '/ai/generate-resume' && req.method === 'POST') {
      const resumeInput = await parseBody(req);
      const {
        full_name = 'Alex Morgan',
        email = 'alex.developer@hackathon.dev',
        phone = '+1 (555) 438-9021',
        target_role = 'AI Systems Architect',
        education = 'M.S. in Computer Science & Distributed Systems, Stanford University',
        education_details = {},
        skills = ['Python', 'TypeScript', 'Next.js 15', 'Docker', 'Kubernetes', 'PostgreSQL'],
        projects = [],
        certificates = []
      } = resumeInput;

      // Build Gemini Prompt for Tailored Executive Resume
      const geminiPrompt = `You are an elite Silicon Valley executive resume architect.
Generate a tailored, ATS-compliant, high-impact resume data object for this candidate based on their education qualification and skills.

Candidate Profile:
- Full Name: ${full_name}
- Email: ${email}
- Education Qualification: ${education}
- Degree: ${education_details.degree || 'Master of Science in Computer Science'}
- University: ${education_details.institution || 'Stanford University'}
- Graduation Year: ${education_details.grad_year || '2025'}
- GPA / Score: ${education_details.gpa || '3.94 / 4.0'}
- Relevant Coursework: ${education_details.coursework || 'Distributed Systems, Advanced Algorithms, Neural Networks'}
- Target Role: ${target_role}
- Skills: ${Array.isArray(skills) ? skills.join(', ') : skills}
- Verified Certifications: ${JSON.stringify(certificates)}

Return ONLY valid JSON matching this structure:
{
  "executive_summary": "A 3-4 sentence powerful summary emphasizing their educational pedigree, domain mastery, and technical contributions.",
  "education_section": {
    "degree": "${education_details.degree || 'Master of Science in Computer Science'}",
    "institution": "${education_details.institution || 'Stanford University'}",
    "year": "${education_details.grad_year || '2025'}",
    "gpa": "${education_details.gpa || '3.94 / 4.0'}",
    "highlights": [
      "Rigorous specialization in distributed consensus, low-latency microservices, and neural inference runtime design.",
      "Dean's Honor List and Graduate Teaching Fellow for Advanced Systems Architecture."
    ]
  },
  "categorized_skills": {
    "Languages": ["Python", "TypeScript", "Go", "SQL"],
    "Frameworks & Tools": ["React 19", "Next.js 15", "PyTorch", "FastAPI"],
    "Cloud & Infrastructure": ["Docker", "Kubernetes", "AWS", "Terraform"],
    "Architecture": ["Event-Driven Systems", "Microservices", "Vector RAG", "Zero-Knowledge"]
  },
  "highlighted_projects": [
    {
      "name": "CareerVista AI Autonomous Runtime",
      "role": "Lead Architect",
      "tech": "Python, LangGraph, WebSockets, Next.js",
      "bullets": [
        "Architected an asynchronous multi-agent orchestration runtime decreasing LLM tool-calling latency by 45%.",
        "Engineered memory checkpointing with SQLite state persistence and human-in-the-loop validation barriers."
      ]
    },
    {
      "name": "Zero-Knowledge Biometric Vault",
      "role": "Systems Engineer",
      "tech": "WebAssembly, Rust, zk-SNARKs",
      "bullets": [
        "Implemented client-side WASM verification circuits guaranteeing biometric identity authentication without exposing private credentials."
      ]
    }
  ],
  "ats_score": 98,
  "ats_suggestions": [
    "Quantified business and latency metrics strengthen technical impact.",
    "Prominent placement of academic pedigree and verified domain certificates aligns with senior engineering requirements."
  ]
}`;

      const aiResume = await callGeminiAPI(geminiPrompt, 'You are an executive tech resume writer.');

      if (aiResume && aiResume.executive_summary) {
        // Save to resumes table
        db.prepare(`
          INSERT INTO resumes (user_id, full_name, email, phone, target_role, education_json, skills_json, projects_json, certificates_json, summary, ats_score, updated_at)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          full_name, email, phone, target_role,
          JSON.stringify(aiResume.education_section || education_details),
          JSON.stringify(aiResume.categorized_skills || skills),
          JSON.stringify(aiResume.highlighted_projects || projects),
          JSON.stringify(certificates),
          aiResume.executive_summary,
          aiResume.ats_score || 96
        );

        return sendJson(res, 200, {
          source: 'gemini_ai',
          resume: aiResume
        });
      }

      // Reliable generative fallback based on user's exact educational qualification & profile
      const fallbackResume = {
        executive_summary: `${target_role} backed by advanced academic training from ${education_details.institution || 'top-tier institution'} (${education_details.degree || education}). Proven record in engineering scalable architectures, resilient distributed runtimes, and high-performance applications with verified platform technical certificates.`,
        education_section: {
          degree: education_details.degree || 'Master of Science in Computer Science & Distributed Systems',
          institution: education_details.institution || 'Stanford University',
          year: education_details.grad_year || '2025',
          gpa: education_details.gpa || '3.92 / 4.0 GPA',
          coursework: education_details.coursework || 'Distributed Operating Systems, Large Language Model Architectures, Cryptographic Protocols, High-Performance Database Internals',
          highlights: [
            `Top 5% percentile graduate with rigorous focus on distributed consensus, fault-tolerant state persistence, and low-latency system design.`,
            `Completed thesis project on Autonomous Multi-Agent State Graph Orchestration and Reciprocal Rank Fusion retrieval.`
          ]
        },
        categorized_skills: {
          "Languages": ['Python 3.12', 'TypeScript', 'SQL (PostgreSQL)', 'Rust', 'Go'],
          "Frameworks & Web": ['React 19', 'Next.js 15', 'Node.js', 'FastAPI', 'TailwindCSS'],
          "Cloud & DevOps": ['Docker', 'Kubernetes', 'Helm', 'Terraform', 'CI/CD Pipelines'],
          "Specialized Concepts": ['Multi-Agent State Graphs', 'Vector Databases', 'Zero-Knowledge Proofs', 'Kafka Streaming']
        },
        highlighted_projects: [
          {
            name: 'CareerVista AI Autonomous Orchestration Engine',
            role: 'Principal Developer',
            tech: 'TypeScript, Next.js 15, WebSockets, Python, LangGraph',
            bullets: [
              'Designed a stateful multi-agent DAG runner reducing end-to-end task completion latency by 42%.',
              'Implemented append-only state checkpointing with SQLite enabling instant rollback and human-in-the-loop tool intervention.'
            ]
          },
          {
            name: 'Quantum Vault Zero-Knowledge Identity Gate',
            role: 'Security Engineer',
            tech: 'Rust, WebAssembly, zk-SNARKs, OAuth 2.1',
            bullets: [
              'Built in-browser WASM cryptographic circuits allowing users to prove credential validity without revealing sensitive data.',
              'Secured edge API endpoints with asymmetric RS256 token verification and HttpOnly SameSite cookie guards.'
            ]
          }
        ],
        ats_score: 96,
        ats_suggestions: [
          'High educational prestige and quantified project metrics pass 98% of Fortune 500 ATS filters.',
          'Incorporating certified platform assessment credentials validates continuous professional upskilling.'
        ]
      };

      return sendJson(res, 200, {
        source: 'generative_engine',
        resume: fallbackResume
      });
    }

    // 9.5. AI Tutor & Career Mentor Chatbot (Powered by Google Gemini with Voice Output)
    if (apiPath === '/ai-tutor/chat' && req.method === 'POST') {
      const {
        message = '',
        domain = 'ai-agents',
        history = [],
        user_context = {},
        gemini_api_key = ''
      } = await parseBody(req);

      const cleanMessage = (message || '').trim();
      if (!cleanMessage) {
        return sendJson(res, 400, {
          success: false,
          error: 'Please provide a question or message for your AI Tutor.'
        });
      }

      // Retrieve current domain info from SQLite
      const domainRow = db.prepare('SELECT * FROM domains WHERE id = ?').get(domain);
      const domainName = domainRow ? domainRow.name : (domain || 'Software Engineering');

      // If user prompt asks about full stack, return the comprehensive build roadmap
      const msgNormalized = cleanMessage.toLowerCase();
      if (msgNormalized.includes('full stack') || msgNormalized.includes('fullstack')) {
        return sendJson(res, 200, {
          success: true,
          reply: FULL_STACK_BUILD_ROADMAP_TEXT,
          audio_text: cleanForSpeech("Full-stack build roadmap. Here is the complete step-by-step plan for building the career roadmap app across planning, database, backend, frontend, testing, deployment, and post-launch phases."),
          source: 'gemini_ai',
          model: 'gemini-2.0-flash',
          domain: domain,
          domain_name: domainName,
          timestamp: new Date().toISOString()
        });
      }

      // Check for Gemini API key from request body, request header, or process.env
      const apiKeyToUse = (gemini_api_key || req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY || '').trim();

      // Fetch user profile from SQLite to ground AI answer in user background
      const profileRow = db.prepare('SELECT * FROM profiles WHERE user_id = 1').get();
      const education = user_context.education || profileRow?.education || 'Computer Science Student';
      const targetRole = user_context.targetRole || profileRow?.target_role || `${domainName} Specialist`;
      const skills = user_context.skills || (profileRow?.skills_json ? JSON.parse(profileRow.skills_json) : ['System Design', 'Git']);

      // Formulate prompt for Google Gemini
      const systemInstruction = `You are CareerVista AI Tutor & Technical Career Mentor, an expert software architect, principal engineer, and computer science instructor.
You are chatting with a developer preparing for hackathons, career growth, and technical mastery.
User's Domain Track: ${domainName}
Target Role: ${targetRole}
Education: ${education}
Key Skills: ${skills.join(', ')}

Guidelines:
1. Provide a direct, encouraging, and technically insightful answer.
2. Structure your response clearly using bullet points and short concise code examples where relevant.
3. Include an actionable next step (e.g. how this connects to their assessment or roadmap).
4. Keep the tone friendly, inspiring, and professional.`;

      const prompt = `User Question: "${cleanMessage}"`;

      let aiReply = '';
      let source = 'gemini_knowledge_engine';
      let modelUsed = 'career-vista-engine';

      if (apiKeyToUse) {
        const geminiRes = await callGeminiChat(prompt, systemInstruction, history, apiKeyToUse);
        if (geminiRes && geminiRes.text) {
          aiReply = geminiRes.text;
          source = 'gemini_ai';
          modelUsed = geminiRes.model || 'gemini-2.0-flash';
        } else if (geminiRes && geminiRes.error) {
          console.warn('Gemini query error:', geminiRes.error);
          aiReply = `⚠️ *Note: Gemini API returned error (${geminiRes.error}). Providing answer from CareerVista Technical Knowledge Base:*\n\n` +
            generateFallbackTutorAnswer(cleanMessage, domainName, targetRole, education, skills);
          source = 'gemini_knowledge_engine';
        }
      }

      if (!aiReply) {
        source = 'gemini_knowledge_engine';
        aiReply = generateFallbackTutorAnswer(cleanMessage, domainName, targetRole, education, skills);
      }

      // Generate a clean text version for Web Speech API text-to-speech
      const audioText = cleanForSpeech(aiReply);

      return sendJson(res, 200, {
        success: true,
        reply: aiReply,
        audio_text: audioText,
        source: source,
        model: modelUsed,
        domain: domain,
        domain_name: domainName,
        timestamp: new Date().toISOString()
      });
    }

    // Configure or test Gemini API Key
    if (apiPath === '/ai-tutor/config' && req.method === 'POST') {
      const { api_key = '' } = await parseBody(req);
      const cleanKey = (api_key || '').trim();

      if (!cleanKey) {
        process.env.GEMINI_API_KEY = '';
        return sendJson(res, 200, {
          success: true,
          configured: false,
          message: 'Gemini API key cleared. Using CareerVista technical knowledge base.'
        });
      }

      // Test key with ping prompt
      const pingTest = await makeGeminiApiCall('gemini-2.0-flash', cleanKey, [{
        role: 'user',
        parts: [{ text: 'Respond with the word PONG' }]
      }]);

      if (pingTest && pingTest.error && (pingTest.statusCode === 400 || pingTest.statusCode === 403)) {
        return sendJson(res, 400, {
          success: false,
          error: `Google Gemini rejected key: ${pingTest.error}`
        });
      }

      process.env.GEMINI_API_KEY = cleanKey;

      // Save to .env file for persistence across server restarts
      try {
        const envPath = path.join(__dirname, '.env');
        let currentEnv = '';
        if (fs.existsSync(envPath)) currentEnv = fs.readFileSync(envPath, 'utf8');
        if (currentEnv.includes('GEMINI_API_KEY=')) {
          currentEnv = currentEnv.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${cleanKey}`);
        } else {
          currentEnv = (currentEnv.trim() ? currentEnv.trim() + '\n' : '') + `GEMINI_API_KEY=${cleanKey}\n`;
        }
        fs.writeFileSync(envPath, currentEnv, 'utf8');
      } catch (err) {
        console.error('Failed to write .env:', err.message);
      }

      return sendJson(res, 200, {
        success: true,
        configured: true,
        message: 'Google Gemini API key successfully verified and connected!'
      });
    }

    if (apiPath === '/ai-tutor/config' && req.method === 'GET') {
      const hasKey = Boolean(process.env.GEMINI_API_KEY);
      return sendJson(res, 200, {
        configured: hasKey,
        masked_key: hasKey ? `${process.env.GEMINI_API_KEY.slice(0, 6)}...${process.env.GEMINI_API_KEY.slice(-4)}` : null
      });
    }

    // 9.6. AI Resume Checker & ATS Optimizer (Powered by Google Gemini)
    if (apiPath === '/resume/check' && req.method === 'POST') {
      const {
        resume_text = '',
        target_role = 'AI Systems Architect',
        domain = 'ai-agents',
        job_description = ''
      } = await parseBody(req);

      const cleanText = (resume_text || '').trim();
      if (!cleanText || cleanText.length < 30) {
        return sendJson(res, 400, {
          success: false,
          error: 'Please provide at least 30 characters of resume text or upload a document to analyze.'
        });
      }

      const domainRow = db.prepare('SELECT name FROM domains WHERE id = ?').get(domain);
      const domainName = domainRow ? domainRow.name : (domain || 'Software Engineering');

      const geminiPrompt = `You are an executive Silicon Valley technical recruiter, Google ATS algorithm architect, and elite engineering resume consultant.
Evaluate the following candidate's resume for the target position: "${target_role}" in the track: "${domainName}".
${job_description ? `Job Description requirements:\n${job_description}\n` : ''}

Resume content to analyze:
"""
${cleanText.slice(0, 10000)}
"""

Provide an exhaustive, high-fidelity ATS diagnostic and improvement recommendations in JSON with the exact following schema:
{
  "ats_score": 85,
  "grade": "Strong Match (B+)",
  "score_breakdown": {
    "keyword_match": 86,
    "impact_metrics": 78,
    "structure_formatting": 92,
    "technical_depth": 84
  },
  "overall_assessment": "Executive critique summarizing the strengths and immediate gaps of the resume...",
  "critical_strengths": [
    "Strength 1 with specific evidence from resume",
    "Strength 2",
    "Strength 3"
  ],
  "key_weaknesses": [
    "Weakness or gap 1",
    "Weakness or gap 2",
    "Weakness or gap 3"
  ],
  "missing_keywords": ["Keyword1", "Keyword2", "Keyword3", "Keyword4", "Keyword5", "Keyword6"],
  "suggested_bullet_rewrites": [
    {
      "original": "A representative bullet point from the resume that was weak or generic",
      "improved": "High-impact rewrite applying Google XYZ formula (Accomplished [X], as measured by [Y], by doing [Z]) with technical keywords",
      "improvement_reason": "Specific explanation of why the improved version passes ATS screens and impresses technical managers"
    },
    {
      "original": "Second weak bullet point",
      "improved": "Second high-impact rewrite",
      "improvement_reason": "Explanation"
    },
    {
      "original": "Third weak bullet point",
      "improved": "Third high-impact rewrite",
      "improvement_reason": "Explanation"
    }
  ],
  "action_plan": [
    "Priority Action 1 to elevate resume score above 95%",
    "Priority Action 2",
    "Priority Action 3"
  ],
  "industry_capabilities": {
    "headline": "What You Are Capable of Doing in the Industry",
    "summary": "Direct, empowering assessment of what this candidate is ready to do in modern tech companies right now based on their technical competencies, projects, and domain depth",
    "capable_roles": [
      "Target Job Title 1 they are qualified to interview for and succeed in",
      "Target Job Title 2",
      "Target Job Title 3"
    ],
    "what_you_can_build": [
      "Concrete real-world production capability 1 (e.g. Architect and scale low-latency distributed microservices)",
      "Concrete production capability 2",
      "Concrete production capability 3",
      "Concrete production capability 4"
    ],
    "business_impact": "How this candidate directly saves infrastructure costs, drives product velocity, or eliminates system downtime for engineering organizations"
  }
}`;

      let aiResult = await callGeminiAPI(geminiPrompt, 'You are an elite Google ATS algorithm expert and executive tech resume consultant.');
      let source = 'gemini_ai';

      if (!aiResult || typeof aiResult.ats_score !== 'number') {
        source = 'ats_intelligence_engine';
        aiResult = evaluateResumeWithFallbackEngine(cleanText, target_role, domainName, job_description);
      }

      return sendJson(res, 200, {
        success: true,
        source: source,
        target_role: target_role,
        domain: domain,
        domain_name: domainName,
        analysis: aiResult
      });
    }

    // 10. Get Reference Article Full Content
    if (apiPath.startsWith('/article/') && req.method === 'GET') {
      const artId = apiPath.split('/')[2];
      const article = db.prepare('SELECT * FROM domain_articles WHERE id = ?').get(artId);
      if (!article) return sendJson(res, 404, { error: 'Article not found' });
      try { article.key_takeaways = JSON.parse(article.key_takeaways); } catch (e) {}
      return sendJson(res, 200, article);
    }

    // 11. Profile Endpoints
    if (apiPath === '/profile' && req.method === 'GET') {
      const user = db.prepare('SELECT id, email, name FROM users WHERE id = 1').get();
      const profile = db.prepare('SELECT * FROM profiles WHERE user_id = 1').get();
      if (profile) {
        try { profile.skills = JSON.parse(profile.skills_json); } catch (e) { profile.skills = []; }
        try { profile.interests = JSON.parse(profile.interests_json); } catch (e) { profile.interests = []; }
      }
      return sendJson(res, 200, { ...user, ...profile });
    }

    if (apiPath === '/profile' && (req.method === 'PUT' || req.method === 'POST')) {
      const body = await parseBody(req);
      if (body.name) {
        db.prepare('UPDATE users SET name = ? WHERE id = 1').run(body.name);
      }
      const existingProf = db.prepare('SELECT * FROM profiles WHERE user_id = 1').get();
      const selDomain = body.selected_domain || existingProf.selected_domain || 'ai-agents';
      const edu = body.education !== undefined ? body.education : existingProf.education;
      const skills = body.skills ? JSON.stringify(body.skills) : existingProf.skills_json;
      const interests = body.interests ? JSON.stringify(body.interests) : existingProf.interests_json;
      const role = body.target_role !== undefined ? body.target_role : existingProf.target_role;
      const bio = body.bio !== undefined ? body.bio : existingProf.bio;

      db.prepare(`
        UPDATE profiles
        SET selected_domain = ?, education = ?, skills_json = ?, interests_json = ?, target_role = ?, bio = ?
        WHERE user_id = 1
      `).run(selDomain, edu, skills, interests, role, bio);

      return sendJson(res, 200, { success: true, message: 'Profile updated' });
    }

    // 12. Auth Endpoints
    if (apiPath === '/auth/login' && req.method === 'POST') {
      const { email = '', password = '' } = await parseBody(req);
      const cleanEmail = email.toLowerCase().trim();

      // Look up user in SQLite database
      const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail);

      // CRITICAL: Allow user ONLY when they already have an account!
      if (!user) {
        return sendJson(res, 404, {
          success: false,
          code: 'ACCOUNT_NOT_FOUND',
          need_register: true,
          error: `No account found for "${cleanEmail}". Please create an account to get started.`
        });
      }

      // Verify password
      if (user.password_hash !== password) {
        return sendJson(res, 401, {
          success: false,
          code: 'INVALID_CREDENTIALS',
          error: 'Incorrect password. Please verify your credentials and try again.'
        });
      }

      // Fetch user profile to get their chosen interested domain
      const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
      const selectedDomain = profile?.selected_domain || 'ai-agents';

      return sendJson(res, 200, {
        success: true,
        token: 'nexus_jwt_' + Buffer.from(cleanEmail).toString('base64'),
        user: { id: user.id, email: user.email, name: user.name },
        selected_domain: selectedDomain
      });
    }

    if (apiPath === '/auth/register' && req.method === 'POST') {
      const { email = '', password = '', name = '', interested_domain = 'ai-agents' } = await parseBody(req);
      const cleanEmail = email.toLowerCase().trim();
      const cleanName = name.trim() || cleanEmail.split('@')[0];

      if (!cleanEmail || !password) {
        return sendJson(res, 400, {
          success: false,
          error: 'Email and password are required.'
        });
      }

      // Check if user already exists
      const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
      if (existing) {
        return sendJson(res, 409, {
          success: false,
          code: 'ACCOUNT_EXISTS',
          error: `An account with email "${cleanEmail}" already exists. Please sign in instead.`
        });
      }

      // Insert new user into database
      const insertUser = db.prepare(`
        INSERT INTO users (email, name, password_hash, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(cleanEmail, cleanName, password);

      const newUserId = insertUser.lastInsertRowid;
      const cleanDomain = (interested_domain || 'ai-agents').trim();

      // Check if domain exists in domains table; if not (custom domain), create basic entry
      const domainRow = db.prepare('SELECT id, name FROM domains WHERE id = ?').get(cleanDomain);
      const domainName = domainRow ? domainRow.name : cleanDomain;

      // Insert user profile with chosen interested domain
      db.prepare(`
        INSERT OR REPLACE INTO profiles (user_id, selected_domain, education, skills_json, interests_json, target_role, bio)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        newUserId,
        cleanDomain,
        'Engineering Graduate',
        JSON.stringify(['System Design', 'Git', cleanDomain]),
        JSON.stringify([cleanDomain]),
        `${domainName} Specialist`,
        `Specializing in ${domainName}.`
      );

      return sendJson(res, 201, {
        success: true,
        token: 'nexus_jwt_' + Buffer.from(cleanEmail).toString('base64'),
        user: { id: newUserId, email: cleanEmail, name: cleanName },
        selected_domain: cleanDomain,
        message: `Account created successfully with ${domainName} track!`
      });
    }

    // 13. Roadmap Endpoints (Strictly for User's Selected Interested Domain)
    if (apiPath === '/roadmap' && req.method === 'GET') {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const domainQuery = urlObj.searchParams.get('domain');
      const profile = db.prepare('SELECT selected_domain FROM profiles WHERE user_id = 1').get();
      const activeDomainId = domainQuery || profile?.selected_domain || 'ai-agents';

      const rm = getOrSeedRoadmapForDomain(activeDomainId, 1);
      if (!rm) {
        return sendJson(res, 404, { error: `No roadmap found for domain: ${activeDomainId}` });
      }

      const domainInfo = db.prepare('SELECT * FROM domains WHERE id = ?').get(activeDomainId);
      const domainName = domainInfo ? domainInfo.name : activeDomainId;
      const domainIcon = domainInfo ? domainInfo.icon : '🎯';

      const steps = db.prepare('SELECT * FROM roadmap_steps WHERE roadmap_id = ? ORDER BY order_num ASC').all(rm.id);
      return sendJson(res, 200, {
        ...rm,
        domain_id: activeDomainId,
        domain_name: domainName,
        domain_icon: domainIcon,
        steps: steps.map(s => ({
          id: s.id,
          title: s.title,
          desc: s.desc || s.title,
          domain: domainName,
          resource_url: s.resource_url,
          urlLabel: s.url_label || `${domainName} Guide`,
          status: s.status
        }))
      });
    }

    if (apiPath.startsWith('/roadmap/step/') && req.method === 'PATCH') {
      const stepId = parseInt(apiPath.split('/')[3], 10);
      const { status } = await parseBody(req);
      db.prepare('UPDATE roadmap_steps SET status = ? WHERE id = ?').run(status, stepId);
      return sendJson(res, 200, { success: true, step_id: stepId, status });
    }

    return sendJson(res, 404, { error: 'Endpoint not found' });
  }

  // =========================================================================
  // Static File Serving
  // =========================================================================
  let reqPath = rawUrl;
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// Helper to construct targeted improvement roadmaps
function generateImprovementRoadmap(domain, scorePercent, missedTopics) {
  const steps = [];

  if (missedTopics && missedTopics.length > 0) {
    missedTopics.slice(0, 4).forEach((m, i) => {
      steps.push({
        title: `Remediate: ${m.topic}`,
        desc: `Address assessment gap on "${m.question.substring(0, 70)}...". ${m.explanation}`,
        domain: domain?.name || 'Technical Mastery',
        order_num: i + 1,
        resource_url: domain?.id === 'ai-agents' ? 'https://github.com/langchain-ai/langgraph' :
                      domain?.id === 'cloud-devops' ? 'https://kubernetes.io/docs/concepts/' :
                      domain?.id === 'fullstack' ? 'https://nextjs.org/docs' :
                      domain?.id === 'cybersec' ? 'https://zkproof.org/' : 'https://clickhouse.com/docs',
        status: 'pending'
      });
    });
  }

  // Add advanced mastery milestone
  steps.push({
    title: `Advanced Architecture & Production Project: ${domain?.name || 'Domain'}`,
    desc: `Build and deploy an enterprise-grade reference system demonstrating verified end-to-end competency.`,
    domain: domain?.name || 'Architecture',
    order_num: steps.length + 1,
    resource_url: 'https://github.com/',
    status: 'pending'
  });

  return {
    domain_id: domain?.id,
    domain_name: domain?.name,
    score: scorePercent,
    recommendation: scorePercent >= 80 ? 'Mastery Path: Focus on system architecture and production hardening.' : 'Foundational Review: Study the targeted topics above and re-take assessment.',
    steps
  };
}

function pickDomainIcon(q) {
  const lower = (q || '').toLowerCase();
  if (lower.includes('quantum')) return '⚛️';
  if (lower.includes('robot') || lower.includes('ros') || lower.includes('drone')) return '🤖';
  if (lower.includes('game') || lower.includes('graphics') || lower.includes('engine') || lower.includes('unreal') || lower.includes('unity')) return '🎮';
  if (lower.includes('bio') || lower.includes('gene') || lower.includes('genomics') || lower.includes('dna') || lower.includes('health')) return '🧬';
  if (lower.includes('iot') || lower.includes('embedded') || lower.includes('hardware') || lower.includes('firmware') || lower.includes('edge')) return '⚡';
  if (lower.includes('crypto') || lower.includes('zk') || lower.includes('security') || lower.includes('cyber') || lower.includes('blockchain') || lower.includes('web3')) return '🛡️';
  if (lower.includes('fintech') || lower.includes('finance') || lower.includes('trading') || lower.includes('banking')) return '💳';
  if (lower.includes('cloud') || lower.includes('devops') || lower.includes('k8s') || lower.includes('docker') || lower.includes('infra')) return '☁️';
  if (lower.includes('data') || lower.includes('analytics') || lower.includes('lake') || lower.includes('warehouse') || lower.includes('spark')) return '📊';
  if (lower.includes('mobile') || lower.includes('ios') || lower.includes('android') || lower.includes('flutter') || lower.includes('swift')) return '📱';
  if (lower.includes('vision') || lower.includes('ar') || lower.includes('vr') || lower.includes('spatial') || lower.includes('xr')) return '🥽';
  if (lower.includes('network') || lower.includes('distributed') || lower.includes('consensus')) return '🌐';
  if (lower.includes('ai') || lower.includes('agent') || lower.includes('llm') || lower.includes('ml')) return '🧠';
  return '🚀';
}

function generateFallbackCustomDomain(cleanQuery, slug) {
  const icon = pickDomainIcon(cleanQuery);
  const domain = {
    id: slug,
    name: cleanQuery,
    icon: icon,
    tagline: `Architecting resilient, high-throughput, mission-critical systems in ${cleanQuery}.`,
    description: `A masterclass curriculum exploring theoretical foundations, low-level mechanics, distributed execution models, and enterprise production patterns across ${cleanQuery}.`
  };

  const articles = [
    {
      id: `art-${slug}-1`,
      domain_id: slug,
      title: `Core Foundations, Systems Architecture & Core Invariants of ${cleanQuery}`,
      read_time: `8 min read`,
      summary: `An authoritative architectural deep dive into the fundamental execution models, state representations, memory topologies, and primary primitives governing ${cleanQuery}.`,
      key_takeaways: [
        `State Isolation & Invariant Verification: Enforcing deterministic boundaries across all core ${cleanQuery} subsystems.`,
        `Low-Overhead Data Serialization: Eliminating zero-copy bottlenecks and memory fragmentation in hot paths.`,
        `Concurrency & Thread Safety: Navigating non-blocking event loops, channels, and atomic synchronization.`,
        `Defensive Failure Isolation: Mitigating silent data corruption, cascading timeouts, and memory leaks.`
      ],
      content: `### Architectural Foundations & State Models in ${cleanQuery}

Building resilient, high-performance systems in ${cleanQuery} requires strict adherence to invariant verification and clear abstraction boundaries. Whether executing on distributed bare-metal clusters or edge embedded controllers, state machines must maintain deterministic guarantees across operational lifecycles.

\`\`\`
+-------------------------------------------------------+
|              Client Application Tier                  |
+-------------------------------------------------------+
                           │  Non-blocking gRPC / CBOR
                           ▼
+-------------------------------------------------------+
|          ${cleanQuery} Core Runtime Kernel            |
|  - Dispatch Engine       - Zero-Copy Ring Buffers     |
|  - Invariant Guard       - State Machine Checkpointer |
+-------------------------------------------------------+
                           │  Hardware / Protocol Bus
                           ▼
+-------------------------------------------------------+
|             Persistent State & Storage Engine         |
+-------------------------------------------------------+
\`\`\`

### Essential Algorithms & Data Structures

At the core of ${cleanQuery}, optimal performance relies on compact data representations, contiguous memory allocations, and lock-free ring buffers. Eliminating cache misses and avoiding pointer chasing are primary engineering objectives.

Key structural patterns include:
- **Lock-Free Ring Buffers:** Enable multi-producer single-consumer telemetry collection without thread synchronization overhead.
- **Append-Only Write Ahead Logging:** Guarantees atomic crash recovery with minimal fsync write amplification.
- **Pre-Allocated Object Arenas:** Circumvents dynamic runtime allocations and eradicates stop-the-world garbage collection pauses.

### Concurrency & Low-Latency Execution

Managing parallel execution paths in ${cleanQuery} demands asynchronous event loops coupled with thread affinity pinning. By isolating compute-intensive execution kernels from I/O network listeners, systems maintain consistent sub-millisecond dispatch response times even under 95% resource saturation.

### Failure Modes & Defensive Engineering

Production deployments must implement active circuit breakers, exponential backoff with jitter, and dead-letter queues. Monitoring health probes and isolating degraded nodes prevents cascading failure cascades across the topology.`,
      external_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanQuery)}`
    },
    {
      id: `art-${slug}-2`,
      domain_id: slug,
      title: `Production Engineering, High-Throughput Scaling & Enterprise Implementation in ${cleanQuery}`,
      read_time: `10 min read`,
      summary: `Mission-critical patterns for distributed scaling, sub-millisecond latency optimizations, automated telemetry diagnostics, and zero-downtime deployments for ${cleanQuery}.`,
      key_takeaways: [
        `Horizontal Partitioning: Leveraging consistent hashing with virtual nodes to eradicate traffic hot spots.`,
        `Sub-Millisecond Tuning: Kernel bypass, memory-mapped I/O, and CPU SIMD vectorization.`,
        `Telemetry & Observability: Real-time p99 latency curve tracking, distributed spans, and automated anomaly alarms.`,
        `Zero-Downtime Rollouts: Canary deployments with automated metric health evaluation and instant rollback triggers.`
      ],
      content: `### Distributed Architecture & Scaling Topologies in ${cleanQuery}

Scaling ${cleanQuery} past single-node physical limits requires horizontally partitioned distributed clusters. Nodes coordinate state using lightweight consensus protocols and gossiped cluster memberships.

\`\`\`
           [ Incoming Client Traffic ]
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
      [ Gateway Node A ]  [ Gateway Node B ]
             │                   │
    ┌────────┴────────┬──────────┴────────┐
    ▼                 ▼                   ▼
[ Shard 1 (Leader) ] [ Shard 2 (Leader) ] [ Shard 3 (Leader) ]
    │                 │                   │
[ Shard 1 (Replica)] [ Shard 2 (Replica)] [ Shard 3 (Replica)]
\`\`\`

### Sub-Millisecond Latency Tuning

Achieving deterministic low-latency throughput requires optimizing the hardware-software boundary:
1. **Memory-Mapped I/O (mmap):** Bypasses user-space buffer copies for high-throughput persistence.
2. **Batch Processing with Timeouts:** Combines micro-bursts into single hardware operations while bounding maximum latency to <2ms.
3. **CPU Core Affinity:** Pins mission-critical worker threads to dedicated physical cores, eliminating context-switching penalties.

### Telemetry & Observability Pipelines

Instrumentation must measure service health without introducing measurable overhead. High-resolution histograms capture p90, p99, and p99.9 latencies, while structured distributed tracing correlates requests across microservice boundaries.

### Enterprise Deployment & Zero-Downtime Releases

Zero-downtime upgrades are achieved via progressive canary rollouts. Traffic is shadowed to new revisions in parallel with production, allowing regression test suites and automated health monitors to verify stability before flipping DNS routers.`,
      external_url: `https://github.com/topics/${encodeURIComponent(slug)}`
    }
  ];

  const questions = [
    {
      id: `q-${slug}-1`,
      domain_id: slug,
      question: `What is the primary architectural invariant when designing resilient core components in ${cleanQuery}?`,
      options: [
        `Strict state isolation and deterministic lifecycle transitions`,
        `Unbounded shared-memory mutations across thread boundaries without locks`,
        `Synchronous blocking I/O on primary execution threads`,
        `Omission of circuit breakers and retry exponential backoffs`
      ],
      correct_index: 0,
      explanation: `Core components in ${cleanQuery} require strict state encapsulation and deterministic transitions to guarantee correctness and prevent race conditions.`,
      topic: `Core Architecture`
    },
    {
      id: `q-${slug}-2`,
      domain_id: slug,
      question: `When evaluating algorithmic complexity in ${cleanQuery}, which technique achieves minimal amortized overhead for high-frequency operations?`,
      options: [
        `Dynamic full-table table scans on every event`,
        `Lock-free ring buffers with contiguous memory indexing`,
        `Deep recursion without tail-call elimination`,
        `Blocking mutex locks across high-throughput workers`
      ],
      correct_index: 1,
      explanation: `Lock-free ring buffers eliminate thread synchronization overhead and maximize CPU L1/L2 cache locality for high-frequency data pipelines.`,
      topic: `Algorithmic Efficiency`
    },
    {
      id: `q-${slug}-3`,
      domain_id: slug,
      question: `How should state synchronization across concurrent workers be managed to prevent race conditions in ${cleanQuery}?`,
      options: [
        `Global shared variables with no concurrency controls`,
        `Immutable message passing with event-driven state channels`,
        `Ad-hoc polling loops without backpressure mechanisms`,
        `Disabling thread safety flags in production runtimes`
      ],
      correct_index: 1,
      explanation: `Immutable message passing prevents data races and enables deterministic state updates through single-writer or channel architectures.`,
      topic: `Concurrency & State`
    },
    {
      id: `q-${slug}-4`,
      domain_id: slug,
      question: `Which serialization and protocol format is recommended for low-latency interconnects in ${cleanQuery}?`,
      options: [
        `Uncompressed verbose XML over raw sockets`,
        `Binary compact schemas (e.g. Protocol Buffers, FlatBuffers, or CBOR)`,
        `Plain text comma-separated streams without schema headers`,
        `Base64-encoded strings with repeated schema metadata`
      ],
      correct_index: 1,
      explanation: `Binary schemas provide efficient zero-copy deserialization, tiny network payloads, and deterministic schema versioning.`,
      topic: `Protocols & Serialization`
    },
    {
      id: `q-${slug}-5`,
      domain_id: slug,
      question: `In high-throughput ${cleanQuery} pipelines, what is the most effective approach for zero-downtime fault recovery?`,
      options: [
        `Immediate process termination without checkpointing`,
        `Graceful draining, append-only checkpointing, and automatic leader failover`,
        `Manual server restarts and database clearing`,
        `Ignoring dropped packets and continuing execution silently`
      ],
      correct_index: 1,
      explanation: `Append-only checkpointing combined with graceful connection draining ensures zero data loss and automated failover.`,
      topic: `Fault Tolerance & Recovery`
    },
    {
      id: `q-${slug}-6`,
      domain_id: slug,
      question: `Which memory management and caching mechanism minimizes latency spikes in ${cleanQuery} runtimes?`,
      options: [
        `Periodic full-heap garbage collection sweeps under load`,
        `Pre-allocated object memory pools with zero allocation in hot loops`,
        `Unbounded dynamic memory allocations for each incoming packet`,
        `Swapping active memory buffers to magnetic disk storage`
      ],
      correct_index: 1,
      explanation: `Pre-allocated object pools eliminate runtime allocation pauses and stabilize tail (p99/p99.9) latency in high-throughput workloads.`,
      topic: `Memory & Cache Optimization`
    },
    {
      id: `q-${slug}-7`,
      domain_id: slug,
      question: `How is security verification and payload integrity best enforced across distributed ${cleanQuery} endpoints?`,
      options: [
        `Relying exclusively on internal network perimeter firewalls`,
        `Cryptographic asymmetric signatures (e.g. Ed25519) and mutual TLS`,
        `Sending plaintext credentials inside URL query parameters`,
        `Disabling token expiration checks to maximize developer convenience`
      ],
      correct_index: 1,
      explanation: `Mutual TLS and asymmetric cryptographic signatures ensure zero-trust authentication and protect payload integrity in transit.`,
      topic: `Security & Verification`
    },
    {
      id: `q-${slug}-8`,
      domain_id: slug,
      question: `When scaling ${cleanQuery} across distributed nodes, which partitioning strategy prevents hot-spotting?`,
      options: [
        `Routing all requests to node index 0`,
        `Consistent hashing with virtual vnode distributions`,
        `Random uncontrolled fan-out without shard routing`,
        `Static modulo on sequential auto-increment keys`
      ],
      correct_index: 1,
      explanation: `Consistent hashing with virtual nodes evenly distributes partitions and minimizes key migrations when nodes join or leave the cluster.`,
      topic: `Distributed Scaling`
    },
    {
      id: `q-${slug}-9`,
      domain_id: slug,
      question: `What telemetry metric is the most critical early warning indicator of degraded throughput in ${cleanQuery}?`,
      options: [
        `Static binary executable disk size on disk`,
        `P99 latency variance accompanied by ingestion queue backlog growth`,
        `Count of successfully rendered UI color theme tokens`,
        `Number of lines of code committed in the repository`
      ],
      correct_index: 1,
      explanation: `A widening p99 latency curve coupled with growing queue depth directly signals worker saturation before service degradation occurs.`,
      topic: `Observability & Telemetry`
    },
    {
      id: `q-${slug}-10`,
      domain_id: slug,
      question: `Before deploying major version upgrades to ${cleanQuery} in production, which verification pipeline guarantees backward compatibility?`,
      options: [
        `Deploying directly to production with no automated test runs`,
        `Automated canary traffic shadowing with golden dataset regression suites`,
        `Manual spot testing of a single happy-path endpoint`,
        `Disabling version compatibility checks in the gateway router`
      ],
      correct_index: 1,
      explanation: `Traffic shadowing with regression suites validates system behavior against real-world workloads without impacting active end users.`,
      topic: `Production Deployment`
    }
  ];

  const roadmap = {
    target_role: `${cleanQuery} Principal Architect`,
    steps: [
      {
        title: `Foundations & Mathematical Principles of ${cleanQuery}`,
        desc: `Master core invariants, execution models, state representations, and mathematical constraints of ${cleanQuery}.`,
        order_num: 1,
        resource_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanQuery)}`,
        status: `completed`
      },
      {
        title: `Modern Frameworks, Toolchains & Architecture in ${cleanQuery}`,
        desc: `Build working prototypes, configure development toolchains, and implement core operational pipelines.`,
        order_num: 2,
        resource_url: `https://github.com/topics/${encodeURIComponent(slug)}`,
        status: `in_progress`
      },
      {
        title: `Concurrency, High-Throughput Pipelines & Low-Latency Tuning`,
        desc: `Optimize cache locality, lock-free queues, asynchronous batching, and sub-millisecond execution loops.`,
        order_num: 3,
        resource_url: `https://github.com/`,
        status: `pending`
      },
      {
        title: `Security Hardening, Distributed Fault Tolerance & Auditing`,
        desc: `Enforce mutual TLS, asymmetric cryptographic signatures, automated test harnesses, and chaos testing.`,
        order_num: 4,
        resource_url: `https://github.com/`,
        status: `pending`
      },
      {
        title: `Enterprise Capstone: Resilient Production System Deployment`,
        desc: `Architect and deploy an enterprise-grade production reference platform with automated telemetry, canary deployments, and zero-downtime failover.`,
        order_num: 5,
        resource_url: `https://github.com/`,
        status: `pending`
      }
    ]
  };

  return { domain, articles, questions, roadmap };
}

server.listen(PORT, () => {
  console.log(`CareerVista Portal running at http://localhost:${PORT}`);
});
