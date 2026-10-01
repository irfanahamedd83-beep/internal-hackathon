/**
 * CareerVista Platform Client Engine
 * Includes Domain Selection, Curated Reference Articles Study Engine,
 * Technical Assessment Engine, and SQLite Database Sync.
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // State Store
  // =========================================================================
  const state = {
    currentView: 'login',
    selectedDomain: 'ai-agents',
    domains: [],
    domainData: {
      domain: null,
      articles: [],
      questions: []
    },
    user: {
      id: 1,
      name: 'Alex Morgan',
      email: 'alex.developer@hackathon.dev',
      bio: 'Full-Stack Architect & AI Systems Builder • Exploring Multi-Agent Autonomous Runtimes',
      education: 'M.S. in Computer Science & Distributed Systems, Stanford University',
      skills: ['Python', 'PyTorch', 'TypeScript', 'React', 'Next.js 15', 'Docker', 'PostgreSQL', 'System Design'],
      interests: ['Autonomous Agents', 'Cloud & DevOps', 'Full-Stack Web', 'Zero-Knowledge', 'Data Engineering'],
      targetRole: 'AI Systems Architect',
      latestScore: 96
    },
    articlesConfirmed: false,
    userCertificates: [
      {
        id: 'CERT-NX-2026-AI01',
        domain_name: 'AI & Autonomous Agents',
        domain_id: 'ai-agents',
        score: 90,
        grade: 'Honor Roll (A+)',
        verification_code: 'VRF-NX-90-A882',
        issued_at: '2026-10-01T12:00:00Z',
        recipient_name: 'Alex Morgan'
      }
    ],
    latestAssessmentResult: null,
    educationDetails: {
      degree: 'M.S. in Computer Science & Distributed Systems',
      institution: 'Stanford University',
      gradYear: '2025',
      gpa: '3.92 / 4.0 GPA',
      coursework: 'Distributed Systems, Large Language Models, Database Internals, Cryptographic Protocols',
      honors: "Dean's Honor List • Graduate Research Fellow in Autonomous Agent State Graphs & RAG"
    },
    projects: [
      {
        id: 1,
        name: 'CareerVista AI Orchestrator',
        status: 'In Review',
        statusClass: 'in-progress',
        desc: 'Autonomous multi-agent workflow runtime with low-latency LLM stream caching.',
        tags: ['TypeScript', 'Next.js 15', 'WebSockets'],
        progress: 88
      },
      {
        id: 2,
        name: 'Quantum Vault Auth',
        status: 'Completed',
        statusClass: 'completed',
        desc: 'Zero-knowledge proof biometric identification protocol running on WebAssembly.',
        tags: ['Rust', 'WASM', 'Cryptography'],
        progress: 100
      }
    ],
    roadmapSteps: [
      {
        id: 1,
        title: 'Master Advanced Python AsyncIO & Low-Latency Event Loops',
        desc: 'Establish concurrency foundations for non-blocking network I/O, custom protocol parsers, and coroutine scheduling.',
        domain: 'Architecture',
        url: 'https://docs.python.org/3/library/asyncio.html',
        urlLabel: 'asyncio Documentation',
        status: 'completed'
      },
      {
        id: 2,
        title: 'Distributed LLM Agent Orchestration & Tool Calling',
        desc: 'Construct stateful LangGraph workflows, token stream caching, and recursive autonomous function call validation.',
        domain: 'AI & ML',
        url: 'https://github.com/langchain-ai/langgraph',
        urlLabel: 'LangGraph Repository & Specs',
        status: 'in-progress'
      },
      {
        id: 3,
        title: 'High-Throughput Vector DB Indexing & Hybrid RAG Pipelines',
        desc: 'Integrate Qdrant vector storage with HNSW index tuning, sparse-dense re-ranking, and millisecond similarity lookups.',
        domain: 'Data Engineering',
        url: 'https://qdrant.tech/documentation/',
        urlLabel: 'Qdrant Architecture Guide',
        status: 'pending'
      },
      {
        id: 4,
        title: 'Zero-Knowledge Biometric Identification & Cryptographic Proofs',
        desc: 'Deploy WebAssembly verification circuits allowing clients to prove authentication rights without divulging credentials.',
        domain: 'Security & Cryptography',
        url: 'https://zkproof.org/',
        urlLabel: 'ZKProof Standards',
        status: 'pending'
      },
      {
        id: 5,
        title: 'Production Kubernetes Autoscaling for Multi-GPU Model Serving',
        desc: 'Orchestrate Ray / vLLM clusters with dynamic horizontal pod autoscalers and Prometheus GPU telemetry metrics.',
        domain: 'Cloud Platform',
        url: 'https://kubernetes.io/docs/tasks/manage-gpus/',
        urlLabel: 'K8s GPU Scheduling Docs',
        status: 'pending'
      }
    ]
  };

  // =========================================================================
  // DOM References
  // =========================================================================
  const views = {
    login: document.getElementById('loginView'),
    profile: document.getElementById('profileView'),
    assessment: document.getElementById('assessmentView'),
    roadmap: document.getElementById('roadmapView'),
    resume: document.getElementById('resumeView')
  };

  const navBtns = {
    login: document.getElementById('menuBtnLogin'),
    profile: document.getElementById('menuBtnProfile'),
    assessment: document.getElementById('menuBtnAssessment'),
    roadmap: document.getElementById('menuBtnRoadmap'),
    resume: document.getElementById('menuBtnResume')
  };

  const currentViewBadge = document.getElementById('currentViewBadge');
  const brandHomeBtn = document.getElementById('brandHomeBtn');
  const menuUserChip = document.getElementById('menuUserChip');
  const menuAvatarInitials = document.getElementById('menuAvatarInitials');
  const menuProfileName = document.getElementById('menuProfileName');
  const menuLogoutBtn = document.getElementById('menuLogoutBtn');
  const menuNotifBtn = document.getElementById('menuNotifBtn');
  const notifDropdown = document.getElementById('notifDropdown');
  const notifBadge = document.getElementById('notifBadge');
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  const featuresDropdownBtn = document.getElementById('featuresDropdownBtn');
  const featuresDropdownWrapper = document.querySelector('.features-dropdown-wrapper');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const ambientBg = document.getElementById('ambientBg');

  // Modals
  const forgotModal = document.getElementById('forgotModal');
  const editProfileModal = document.getElementById('editProfileModal');
  const submitProjectModal = document.getElementById('submitProjectModal');
  const studyArticleModal = document.getElementById('studyArticleModal');
  const certificateModal = document.getElementById('certificateModal');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // =========================================================================
  // 1. Toast Notification Utility
  // =========================================================================
  function showToast(title, message, type = 'info', duration = 3800) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`,
      error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      setTimeout(() => toast.remove(), 280);
    }, duration);
  }

  // =========================================================================
  // 2. View Router Engine (1-Click Switcher)
  // =========================================================================
  function switchView(targetView) {
    if (!views[targetView]) return;

    Object.keys(views).forEach(key => {
      if (views[key]) views[key].classList.add('hidden');
    });

    Object.keys(navBtns).forEach(key => {
      if (navBtns[key]) navBtns[key].classList.remove('active');
    });

    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      if (btn.getAttribute('data-view') === targetView) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    views[targetView].classList.remove('hidden');
    if (navBtns[targetView]) navBtns[targetView].classList.add('active');

    state.currentView = targetView;
    const viewNames = {
      login: 'Login / Auth',
      profile: 'Profile',
      assessment: 'Assessment',
      roadmap: 'Roadmap',
      resume: 'Resume & Checker'
    };
    if (featuresDropdownWrapper) featuresDropdownWrapper.classList.remove('open');
    if (mobileNavDrawer) mobileNavDrawer.classList.add('hidden');

    if (targetView === 'roadmap') {
      loadRoadmapForActiveDomain();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  Object.keys(navBtns).forEach(key => {
    if (navBtns[key]) {
      navBtns[key].addEventListener('click', () => switchView(key));
    }
  });

  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-view');
      switchView(v);
    });
  });

  if (brandHomeBtn) {
    brandHomeBtn.addEventListener('click', () => switchView(state.currentView === 'login' ? 'profile' : 'login'));
  }

  if (menuUserChip) {
    menuUserChip.addEventListener('click', () => switchView('profile'));
  }

  if (mobileMenuToggle && mobileNavDrawer) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileNavDrawer.classList.toggle('hidden');
    });
  }

  // =========================================================================
  // 3. Domain & Assessment Engine (Backend & SQLite Integration)
  // =========================================================================
  const domainPillsList = document.getElementById('domainPillsList');
  const activeDomainHero = document.getElementById('activeDomainHero');
  const activeDomainIcon = document.getElementById('activeDomainIcon');
  const activeDomainTitle = document.getElementById('activeDomainTitle');
  const activeDomainDesc = document.getElementById('activeDomainDesc');
  const assessmentDomainBadge = document.getElementById('assessmentDomainBadge');
  const referenceArticlesGrid = document.getElementById('referenceArticlesGrid');
  const domainQuestionsContainer = document.getElementById('domainQuestionsContainer');
  const assessmentForm = document.getElementById('assessmentForm');
  const scoringOutputPanel = document.getElementById('scoringOutputPanel');
  const submitAssessmentBtn = document.getElementById('submitAssessmentBtn');

  // Article Completion & Assessment Lock Elements
  const articleConfirmationCard = document.getElementById('articleConfirmationCard');
  const confirmArticlesReadCheck = document.getElementById('confirmArticlesReadCheck');
  const unlockAssessmentBtn = document.getElementById('unlockAssessmentBtn');
  const assessmentLockedGate = document.getElementById('assessmentLockedGate');
  const scrollToArticlesBtn = document.getElementById('scrollToArticlesBtn');
  const geminiRegenQBtn = document.getElementById('geminiRegenQBtn');
  const qProgressIndicator = document.getElementById('qProgressIndicator');
  const confDomainName = document.getElementById('confDomainName');
  const step2WorkflowCard = document.getElementById('step2WorkflowCard');

  // Certificate Modal Elements
  const closeCertificateModal = document.getElementById('closeCertificateModal');
  const closeCertModalBtn = document.getElementById('closeCertModalBtn');
  const printCertificateBtn = document.getElementById('printCertificateBtn');

  // Resume Builder Elements
  const aiEnhanceResumeBtn = document.getElementById('aiEnhanceResumeBtn');
  const saveResumeBtn = document.getElementById('saveResumeBtn');
  const printResumeBtn = document.getElementById('printResumeBtn');
  const refreshResumePreviewBtn = document.getElementById('refreshResumePreviewBtn');

  // Initialize Article Confirmation Logic
  function initArticleConfirmation() {
    if (confirmArticlesReadCheck && unlockAssessmentBtn) {
      confirmArticlesReadCheck.addEventListener('change', () => {
        unlockAssessmentBtn.disabled = !confirmArticlesReadCheck.checked;
      });

      unlockAssessmentBtn.addEventListener('click', () => {
        state.articlesConfirmed = true;
        if (assessmentLockedGate) assessmentLockedGate.classList.add('hidden');
        if (assessmentForm) assessmentForm.classList.remove('hidden');
        if (articleConfirmationCard) articleConfirmationCard.classList.add('confirmed');
        showToast('Assessment Unlocked', 'You may now attend the 10 technical questions below.', 'success');
        if (step2WorkflowCard) {
          step2WorkflowCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    if (scrollToArticlesBtn) {
      scrollToArticlesBtn.addEventListener('click', () => {
        const step1 = document.querySelector('.assessment-workflow-card');
        if (step1) step1.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    if (geminiRegenQBtn) {
      geminiRegenQBtn.addEventListener('click', () => {
        regenerateGeminiQuestions();
      });
    }

    // Certificate Modal Bindings
    if (closeCertificateModal) closeCertificateModal.addEventListener('click', () => closeModal(certificateModal));
    if (closeCertModalBtn) closeCertModalBtn.addEventListener('click', () => closeModal(certificateModal));
    if (printCertificateBtn) {
      printCertificateBtn.addEventListener('click', () => {
        document.body.classList.add('printing-cert');
        window.print();
        setTimeout(() => document.body.classList.remove('printing-cert'), 500);
      });
    }
  }

  // =========================================================================
  // 3.1. Dynamic Custom Domain Search & Gemini AI Generation
  // =========================================================================
  function initDomainSearch() {
    const domainSearchWrapper = document.getElementById('domainSearchWrapper');
    const domainSearchInput = document.getElementById('domainSearchInput');
    const domainSearchBtn = document.getElementById('domainSearchBtn');
    const domainSearchClearBtn = document.getElementById('domainSearchClearBtn');
    const otherDomainPill = document.getElementById('otherDomainPill');
    const profileOtherDomainPill = document.getElementById('profileOtherDomainPill');
    const profileDomainSearchInput = document.getElementById('profileDomainSearchInput');
    const profileDomainSearchBtn = document.getElementById('profileDomainSearchBtn');

    window.focusDomainSearch = function() {
      if (domainSearchWrapper) {
        domainSearchWrapper.classList.add('focus-highlight');
        setTimeout(() => domainSearchWrapper.classList.remove('focus-highlight'), 1800);
      }
      if (domainSearchInput) {
        domainSearchInput.focus();
        domainSearchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      showToast('Search Any Domain', 'Type any topic or select a suggestion below to generate an AI track.', 'info');
    };

    if (otherDomainPill) {
      otherDomainPill.addEventListener('click', (e) => {
        e.preventDefault();
        window.focusDomainSearch();
      });
    }

    if (profileOtherDomainPill) {
      profileOtherDomainPill.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('assessment');
        setTimeout(() => window.focusDomainSearch(), 200);
      });
    }

    if (domainSearchClearBtn && domainSearchInput) {
      domainSearchInput.addEventListener('input', () => {
        if (domainSearchInput.value.trim()) {
          domainSearchClearBtn.classList.remove('hidden');
        } else {
          domainSearchClearBtn.classList.add('hidden');
        }
      });

      domainSearchClearBtn.addEventListener('click', () => {
        domainSearchInput.value = '';
        domainSearchClearBtn.classList.add('hidden');
        domainSearchInput.focus();
      });
    }

    // Quick chip buttons
    document.querySelectorAll('.domain-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        if (domainSearchInput && query) {
          domainSearchInput.value = query;
          if (domainSearchClearBtn) domainSearchClearBtn.classList.remove('hidden');
          executeDomainSearch(query);
        }
      });
    });

    if (domainSearchBtn && domainSearchInput) {
      domainSearchBtn.addEventListener('click', () => {
        const query = domainSearchInput.value.trim();
        executeDomainSearch(query);
      });

      domainSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          executeDomainSearch(domainSearchInput.value.trim());
        }
      });
    }

    if (profileDomainSearchBtn && profileDomainSearchInput) {
      const handleProfileSearch = () => {
        const query = profileDomainSearchInput.value.trim();
        if (query) {
          switchView('assessment');
          if (domainSearchInput) domainSearchInput.value = query;
          executeDomainSearch(query);
        }
      };

      profileDomainSearchBtn.addEventListener('click', handleProfileSearch);
      profileDomainSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleProfileSearch();
        }
      });
    }

    async function executeDomainSearch(query) {
      if (!query || query.length < 2) {
        showToast('Search Query Required', 'Please enter a domain topic to search (e.g. Robotics, Quantum, Game Engine).', 'warning');
        if (domainSearchInput) domainSearchInput.focus();
        return;
      }

      // Button loading state
      const searchBtnText = domainSearchBtn ? domainSearchBtn.querySelector('.search-btn-text') : null;
      const searchBtnSpinner = domainSearchBtn ? domainSearchBtn.querySelector('.search-btn-spinner') : null;
      const originalText = searchBtnText ? searchBtnText.textContent : 'Search & Generate Track';

      if (domainSearchBtn) domainSearchBtn.disabled = true;
      if (searchBtnText) searchBtnText.textContent = '✨ Gemini Generating Track...';
      if (searchBtnSpinner) searchBtnSpinner.classList.remove('hidden');

      showToast('Generating AI Track', `Synthesizing articles, assessment questions, and roadmap for "${query}" using Gemini in backend...`, 'info');

      try {
        const res = await fetch('/api/v1/domains/custom-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate domain track');
        }

        const data = await res.json();
        const { domain, articles, questions, roadmap, source } = data;

        // Reset article confirmation
        state.selectedDomain = domain.id;
        state.domainData = { domain, articles, questions };
        state.articlesConfirmed = false;

        if (confirmArticlesReadCheck) confirmArticlesReadCheck.checked = false;
        if (unlockAssessmentBtn) unlockAssessmentBtn.disabled = true;
        if (assessmentLockedGate) assessmentLockedGate.classList.remove('hidden');
        if (assessmentForm) assessmentForm.classList.add('hidden');
        if (articleConfirmationCard) articleConfirmationCard.classList.remove('confirmed');
        if (confDomainName) confDomainName.textContent = domain.name;

        // Inject or activate domain pill in Assessment View
        injectOrActivateDomainPill(domain);

        // Inject or activate domain pill in Profile View
        injectOrActivateProfileInterestPill(domain);

        // Render Active Domain Hero Header
        renderActiveDomainHeader(domain);

        // Render the 2 Study Reference Articles in Step 1
        renderReferenceArticles(articles);

        // Render the 10 Technical Questions in Step 2
        renderDomainQuestions(questions);

        // Synchronize and render the new Domain Roadmap in the Roadmap tab
        if (roadmap && Array.isArray(roadmap.steps) && roadmap.steps.length > 0) {
          state.roadmapSteps = roadmap.steps.map((s, idx) => ({
            id: s.id || idx + 1,
            title: s.title,
            desc: s.desc,
            domain: s.domain || domain.name,
            url: s.resource_url || 'https://github.com/',
            urlLabel: 'Reference Resource',
            status: s.status || (idx === 0 ? 'completed' : idx === 1 ? 'in-progress' : 'pending')
          }));

          const roadmapRoleBadge = document.getElementById('roadmapRoleBadge');
          if (roadmapRoleBadge && roadmap.target_role) {
            roadmapRoleBadge.textContent = roadmap.target_role;
          }

          renderRoadmap();
        }

        // Update profile domain card
        updateProfileDomainCards(domain);

        // Reset scoring panel if previously open
        if (scoringOutputPanel) {
          scoringOutputPanel.classList.add('hidden');
          scoringOutputPanel.innerHTML = '';
        }

        showToast(
          'Track Generated ✨',
          `"${domain.name}" generated with 2 Study Articles, ${questions.length} Questions & Custom Roadmap via ${source === 'gemini_ai' ? 'Gemini AI' : 'Generative Engine'}!`,
          'success'
        );

        // Scroll down to the generated articles smoothly
        if (activeDomainHero) {
          activeDomainHero.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (err) {
        console.error('Domain search error:', err);
        showToast('Generation Error', err.message || 'Unable to generate track. Please try again.', 'error');
      } finally {
        if (domainSearchBtn) domainSearchBtn.disabled = false;
        if (searchBtnText) searchBtnText.textContent = originalText;
        if (searchBtnSpinner) searchBtnSpinner.classList.add('hidden');
      }
    }

    function injectOrActivateDomainPill(domain) {
      if (!domainPillsList) return;
      let existingPill = domainPillsList.querySelector(`[data-domain="${domain.id}"]`);

      // Deactivate all pills
      domainPillsList.querySelectorAll('.domain-pill').forEach(p => p.classList.remove('active'));

      if (!existingPill) {
        // Create new pill and insert before otherDomainPill
        const newPill = document.createElement('button');
        newPill.type = 'button';
        newPill.className = 'domain-pill active';
        newPill.setAttribute('data-domain', domain.id);
        newPill.innerHTML = `
          <span class="dp-icon">${domain.icon}</span>
          <span>${domain.name}</span>
        `;
        newPill.addEventListener('click', () => selectDomain(domain.id, false));

        if (otherDomainPill && otherDomainPill.parentNode === domainPillsList) {
          domainPillsList.insertBefore(newPill, otherDomainPill);
        } else {
          domainPillsList.appendChild(newPill);
        }
      } else {
        existingPill.classList.add('active');
      }
    }

    function injectOrActivateProfileInterestPill(domain) {
      const tagCloud = document.getElementById('interestsTagCloud');
      if (!tagCloud) return;

      tagCloud.querySelectorAll('.interest-pill').forEach(p => p.classList.remove('active'));

      let existingPill = tagCloud.querySelector(`[data-domain="${domain.id}"]`);
      if (!existingPill) {
        const newPill = document.createElement('button');
        newPill.type = 'button';
        newPill.className = 'interest-pill active';
        newPill.setAttribute('data-domain', domain.id);
        newPill.textContent = `${domain.icon} ${domain.name}`;
        newPill.addEventListener('click', () => selectDomain(domain.id, true));

        const profOther = document.getElementById('profileOtherDomainPill');
        if (profOther && profOther.parentNode === tagCloud) {
          tagCloud.insertBefore(newPill, profOther);
        } else {
          tagCloud.appendChild(newPill);
        }

        const countEl = document.getElementById('interestsCount');
        if (countEl) {
          const currentCount = parseInt(countEl.textContent, 10) || 5;
          countEl.textContent = currentCount + 1;
        }
      } else {
        existingPill.classList.add('active');
      }
    }
  }

  // Load domain details with 2 reference articles and at least 10 assessment questions from backend
  async function selectDomain(domainId, navigateToAssessment = false) {
    if (domainId === 'other') {
      if (navigateToAssessment) switchView('assessment');
      if (typeof window.focusDomainSearch === 'function') window.focusDomainSearch();
      return;
    }

    state.selectedDomain = domainId;

    // Reset article confirmation on domain switch
    state.articlesConfirmed = false;
    if (confirmArticlesReadCheck) confirmArticlesReadCheck.checked = false;
    if (unlockAssessmentBtn) unlockAssessmentBtn.disabled = true;
    if (assessmentLockedGate) assessmentLockedGate.classList.remove('hidden');
    if (assessmentForm) assessmentForm.classList.add('hidden');
    if (articleConfirmationCard) articleConfirmationCard.classList.remove('confirmed');

    // Update active state in domain pills (Assessment page)
    document.querySelectorAll('.domain-pill').forEach(btn => {
      if (btn.getAttribute('data-domain') === domainId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update active state in interest pills (Profile page)
    document.querySelectorAll('.interest-pill').forEach(btn => {
      if (btn.getAttribute('data-domain') === domainId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    try {
      const res = await fetch(`/api/v1/domains/${domainId}`);
      if (!res.ok) throw new Error('Domain not found');
      const data = await res.json();
      state.domainData = data;

      if (confDomainName) confDomainName.textContent = data.domain?.name || 'this track';
      if (qProgressIndicator) qProgressIndicator.textContent = `${data.questions?.length || 10} Technical Questions`;

      renderActiveDomainHeader(data.domain);
      renderReferenceArticles(data.articles);
      renderDomainQuestions(data.questions);

      // Synchronize and render the exclusive Roadmap for THIS selected domain
      if (data.roadmap && Array.isArray(data.roadmap.steps) && data.roadmap.steps.length > 0) {
        state.roadmapSteps = data.roadmap.steps.map((s, idx) => ({
          id: s.id || (idx + 1),
          title: s.title,
          desc: s.desc || s.title,
          domain: data.domain?.name || s.domain,
          url: s.resource_url || 'https://careervista.dev/resources',
          urlLabel: s.urlLabel || `${data.domain?.name || 'Milestone'} Guide`,
          status: s.status || (idx === 0 ? 'completed' : idx === 1 ? 'in-progress' : 'pending')
        }));
        const roadmapRoleBadge = document.getElementById('roadmapRoleBadge');
        if (roadmapRoleBadge && data.roadmap.target_role) {
          roadmapRoleBadge.textContent = data.roadmap.target_role;
        }
        const roadmapDomainBadge = document.getElementById('roadmapDomainBadge');
        if (roadmapDomainBadge && data.domain) {
          roadmapDomainBadge.textContent = `${data.domain.icon || '🎯'} ${data.domain.name}`;
        }
        renderRoadmap();
      }

      // Reset scoring output
      if (scoringOutputPanel) {
        scoringOutputPanel.classList.add('hidden');
        scoringOutputPanel.innerHTML = '';
      }

      // Update Profile cards
      updateProfileDomainCards(data.domain);

      // Update AI Tutor domain context badge
      const aiTutorDomainTag = document.getElementById('aiTutorDomainTag');
      if (aiTutorDomainTag && data.domain) {
        aiTutorDomainTag.textContent = `${data.domain.icon || '🎯'} ${data.domain.name}`;
      }

      // Persist selection to SQLite backend
      fetch('/api/v1/domains/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain_id: domainId })
      }).catch(() => {});

      if (navigateToAssessment) {
        switchView('assessment');
        showToast('Domain Selected', `Loaded study articles & assessment for "${data.domain.name}".`, 'info');
      }
    } catch (err) {
      console.error('Failed to load domain:', err);
    }
  }

  function renderActiveDomainHeader(domain) {
    if (!domain) return;
    if (activeDomainIcon) activeDomainIcon.textContent = domain.icon;
    if (activeDomainTitle) activeDomainTitle.textContent = domain.name;
    if (activeDomainDesc) activeDomainDesc.textContent = domain.description;
    if (assessmentDomainBadge) assessmentDomainBadge.textContent = `${domain.icon} ${domain.name}`;
  }

  function renderReferenceArticles(articles) {
    if (!referenceArticlesGrid) return;
    if (!articles || !articles.length) {
      referenceArticlesGrid.innerHTML = '<p class="text-muted">No reference articles available.</p>';
      return;
    }

    referenceArticlesGrid.innerHTML = articles.map(art => {
      const takeawaysList = Array.isArray(art.key_takeaways)
        ? art.key_takeaways.map(t => `<div class="takeaway-item"><span style="color:#10b981;">✓</span> <span>${t}</span></div>`).join('')
        : '';

      return `
        <div class="article-card">
          <div>
            <div class="article-top-row">
              <span class="article-read-badge">${art.read_time}</span>
              <span class="sub-hint">Reference Guide</span>
            </div>
            <h4 class="article-title">${art.title}</h4>
            <p class="article-summary">${art.summary}</p>
            <div class="article-key-takeaways">
              <div class="takeaway-header">💡 Key Architectural Takeaways</div>
              ${takeawaysList}
            </div>
          </div>
          <div class="article-action-buttons">
            <button type="button" class="study-article-btn" data-art-id="${art.id}">
              <span>📖 Study Article Now</span>
            </button>
            <a href="${art.external_url}" target="_blank" rel="noopener noreferrer" class="article-ext-btn" title="Open official documentation">
              <span>Docs ↗</span>
            </a>
          </div>
        </div>
      `;
    }).join('');

    // Bind study buttons
    referenceArticlesGrid.querySelectorAll('.study-article-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const artId = btn.getAttribute('data-art-id');
        const art = state.domainData.articles.find(a => a.id === artId);
        if (art) openStudyModal(art);
      });
    });
  }

  // Renders at least 10 technical questions
  function renderDomainQuestions(questions) {
    if (!domainQuestionsContainer) return;
    if (!questions || !questions.length) {
      domainQuestionsContainer.innerHTML = '<p class="text-muted">No questions available for this domain.</p>';
      return;
    }

    if (qProgressIndicator) {
      qProgressIndicator.textContent = `${questions.length} Technical Questions`;
    }

    domainQuestionsContainer.innerHTML = questions.map((q, idx) => {
      const numStr = (idx + 1) < 10 ? `0${idx + 1}` : `${idx + 1}`;
      const optionsHtml = (q.options || []).map((opt, oIdx) => `
        <label class="q-option">
          <input type="radio" name="${q.id}" value="${oIdx}" ${oIdx === 0 ? 'checked' : ''}>
          <span class="opt-box">
            <strong>Option ${String.fromCharCode(65 + oIdx)}</strong>
            <span>${opt}</span>
          </span>
        </label>
      `).join('');

      return `
        <div class="assessment-card" data-q-id="${q.id}">
          <div class="q-badge">Question ${numStr} of ${questions.length} ${q.topic ? `• <span style="color:#94a3b8">${q.topic}</span>` : ''}</div>
          <h4 class="q-text">${q.question}</h4>
          <div class="q-options-grid">
            ${optionsHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // Backend Gemini Question Generator
  async function regenerateGeminiQuestions() {
    if (!geminiRegenQBtn) return;
    const originalText = geminiRegenQBtn.innerHTML;
    geminiRegenQBtn.innerHTML = '<span>✨ Generating with Gemini...</span>';
    geminiRegenQBtn.disabled = true;

    try {
      const res = await fetch('/api/v1/assessment/generate-gemini-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain_id: state.selectedDomain })
      });
      const data = await res.json();
      geminiRegenQBtn.innerHTML = originalText;
      geminiRegenQBtn.disabled = false;

      if (data && data.questions && data.questions.length >= 10) {
        state.domainData.questions = data.questions;
        renderDomainQuestions(data.questions);
        showToast(
          'Questions Generated',
          `Loaded ${data.questions.length} questions via ${data.source === 'gemini_ai' ? 'Gemini AI' : 'curated engine'}.`,
          'success'
        );
      }
    } catch (err) {
      geminiRegenQBtn.innerHTML = originalText;
      geminiRegenQBtn.disabled = false;
      console.error('Gemini question generation error:', err);
    }
  }

  function updateProfileDomainCards(domain) {
    if (!domain) return;
    const profileDomainName = document.getElementById('profileDomainName');
    const profileDomainIcon = document.getElementById('profileDomainIcon');
    const profileTargetRole = document.getElementById('profileTargetRole');

    if (profileDomainName) profileDomainName.textContent = domain.name;
    if (profileDomainIcon) profileDomainIcon.textContent = domain.icon;
    if (profileTargetRole) profileTargetRole.textContent = domain.name;
  }

  // Open Study Reference Article Reader Modal
  function openStudyModal(article) {
    if (!studyArticleModal || !article) return;

    const modalDomain = document.getElementById('modalArticleDomain');
    const modalReadTime = document.getElementById('modalArticleReadTime');
    const modalTitle = document.getElementById('modalArticleTitle');
    const modalTakeaways = document.getElementById('modalArticleTakeaways');
    const modalContent = document.getElementById('modalArticleContent');
    const modalExtLink = document.getElementById('modalArticleExternalLink');

    if (modalDomain) modalDomain.textContent = state.domainData.domain?.name || 'Domain Guide';
    if (modalReadTime) modalReadTime.textContent = article.read_time;
    if (modalTitle) modalTitle.textContent = article.title;

    if (modalTakeaways && Array.isArray(article.key_takeaways)) {
      modalTakeaways.innerHTML = article.key_takeaways.map(t => `<li>${t}</li>`).join('');
    }

    if (modalContent) {
      let html = article.content
        .replace(/### (.*)/g, '<h3>$1</h3>')
        .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n\n/g, '<p></p>');
      modalContent.innerHTML = html;
    }

    if (modalExtLink) {
      modalExtLink.href = article.external_url;
    }

    openModal(studyArticleModal);
  }

  const closeStudyArticleModal = document.getElementById('closeStudyArticleModal');
  if (closeStudyArticleModal) closeStudyArticleModal.addEventListener('click', () => closeModal(studyArticleModal));

  const modalReadyToAttendBtn = document.getElementById('modalReadyToAttendBtn');
  if (modalReadyToAttendBtn) {
    modalReadyToAttendBtn.addEventListener('click', () => {
      closeModal(studyArticleModal);
      switchView('assessment');

      // Auto-confirm reading verification and unlock 10 questions
      if (confirmArticlesReadCheck) confirmArticlesReadCheck.checked = true;
      if (unlockAssessmentBtn) {
        unlockAssessmentBtn.disabled = false;
        unlockAssessmentBtn.click();
      }
      showToast('Articles Finished', 'Verified reading completion! 10-Question assessment is unlocked.', 'success');
    });
  }

  // Assessment Form Submission (Evaluates 10 Questions against SQLite Database)
  if (assessmentForm) {
    assessmentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Gather answers for all questions
      const answers = {};
      state.domainData.questions.forEach(q => {
        const selected = document.querySelector(`input[name="${q.id}"]:checked`);
        answers[q.id] = selected ? parseInt(selected.value, 10) : 0;
      });

      setButtonLoading(submitAssessmentBtn, true);

      try {
        const res = await fetch('/api/v1/assessment/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain_id: state.selectedDomain,
            answers: answers,
            user_id: state.user.id || 1
          })
        });

        const data = await res.json();
        setButtonLoading(submitAssessmentBtn, false);

        state.latestAssessmentResult = data;

        // If certificate awarded, store in user certificates
        if (data.certificate) {
          state.userCertificates = state.userCertificates || [];
          state.userCertificates.unshift({
            ...data.certificate,
            grade: data.grade
          });
          syncCertificatesToResume();
        }

        // Render Results
        renderAssessmentResults(data);

        // Update profile latest score
        const profileLatestScore = document.getElementById('profileLatestScore');
        if (profileLatestScore) {
          profileLatestScore.innerHTML = `${data.score}% <small>${data.certificate ? 'Certified (≥75%)' : 'Needs Review (<75%)'}</small>`;
        }

        showToast(
          data.certificate ? 'Certificate Earned! 🎓' : 'Assessment Evaluated',
          `Scored ${data.score}% (${data.correct_count}/${data.total_questions} correct). ${data.feedback}`,
          data.certificate ? 'success' : 'info'
        );

        if (scoringOutputPanel) {
          scoringOutputPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } catch (err) {
        setButtonLoading(submitAssessmentBtn, false);
        console.error('Submission failed:', err);
      }
    });
  }

  // Renders score percentage, certificate card, improvement roadmap, and question review
  function renderAssessmentResults(result) {
    if (!scoringOutputPanel) return;

    const reviewItemsHtml = (result.review || []).map((r, i) => `
      <div class="review-card ${r.is_correct ? 'correct' : 'incorrect'}">
        <div class="review-header">
          <span class="sub-hint">Question ${(i + 1) < 10 ? '0' + (i + 1) : (i + 1)} • ${r.topic || 'Concept'}</span>
          <span class="review-status-tag ${r.is_correct ? 'correct' : 'incorrect'}">
            ${r.is_correct ? 'Correct ✓' : 'Incorrect ✗'}
          </span>
        </div>
        <h5 class="review-q-text">${r.question}</h5>
        <div class="review-answers-box">
          <div><strong>Your Answer:</strong> ${r.user_answer}</div>
          ${!r.is_correct ? `<div style="color:#10b981; margin-top:2px;"><strong>Correct Answer:</strong> ${r.correct_answer}</div>` : ''}
        </div>
        <div class="review-exp"><strong>Explanation:</strong> ${r.explanation}</div>
      </div>
    `).join('');

    // Certificate Showcase Card - Only awarded when score >= 75%
    const certificateCardHtml = result.certificate ? `
      <div class="cert-showcase-card">
        <div class="cert-showcase-left">
          <div class="cert-badge-crest-sm">🎓</div>
          <div>
            <span class="badge-role" style="background:rgba(245,158,11,0.2); color:#fbbf24; border-color:rgba(245,158,11,0.4);">Official Credential Issued • Score ${result.score}% (≥75%)</span>
            <h4 class="cert-showcase-title">Certificate of Technical Proficiency</h4>
            <p class="cert-showcase-sub">Awarded to <strong>${result.certificate.recipient_name}</strong> for scoring <strong>${result.score}%</strong> in ${result.certificate.domain_name}. ID: <code>${result.certificate.verification_code}</code></p>
          </div>
        </div>
        <button type="button" class="dash-btn primary" id="viewCertFromResultsBtn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          <span>View &amp; Print Certificate</span>
        </button>
      </div>
    ` : `
      <div class="cert-showcase-card cert-locked-notice">
        <div class="cert-showcase-left">
          <div class="cert-badge-crest-sm cert-locked-crest">🔒</div>
          <div>
            <span class="badge-role badge-cert-locked">Certificate Locked • Requires Score ≥ 75%</span>
            <h4 class="cert-showcase-title" style="color:#e2e8f0;">Official Certificate Not Issued</h4>
            <p class="cert-showcase-sub">You scored <strong>${result.score}%</strong>. Official CareerVista technical certificates are provided exclusively for scores of <strong>75% or higher</strong>. Follow your personalized roadmap below to review missed topics, then re-take the assessment to earn your credential.</p>
          </div>
        </div>
        <button type="button" class="dash-btn outline" id="retakeAssessmentFromCardBtn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          <span>Retake for 75%+</span>
        </button>
      </div>
    `;

    // Personalized Improvement Roadmap Card
    const improvementSteps = result.improvement_roadmap?.steps || [];
    const improvementRoadmapHtml = `
      <div class="improvement-roadmap-card">
        <div class="imp-header">
          <div>
            <span class="badge-role" style="background:rgba(6,182,212,0.2); color:#38bdf8; border-color:rgba(6,182,212,0.4);">Targeted Skill Growth</span>
            <h4 class="imp-title">Personalized Improvement Roadmap</h4>
            <p class="imp-sub">${result.improvement_roadmap?.recommendation || 'Personalized skill roadmap based on assessment analysis.'}</p>
          </div>
          <button type="button" class="dash-btn outline btn-xs" id="adoptImprovementBtn">
            <span>🚀 Adopt to My Roadmap Tab →</span>
          </button>
        </div>
        <div class="imp-steps-list">
          ${improvementSteps.map((step, idx) => `
            <div class="imp-step-item">
              <div class="imp-step-num">${idx + 1}</div>
              <div class="imp-step-content">
                <strong>${step.title}</strong>
                <p>${step.desc || ''}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    scoringOutputPanel.innerHTML = `
      <div class="result-summary-card ${result.passed ? 'passed' : 'failed'}">
        <div>
          <span class="badge-role">${state.domainData.domain?.name || 'Domain'} Examination</span>
          <h4 class="view-title" style="margin-top:0.35rem; font-size:1.35rem;">${result.feedback}</h4>
          <p class="view-subtitle">You answered ${result.correct_count} out of ${result.total_questions} questions correctly (${result.grade || ''}).</p>
        </div>
        <div class="result-score-circle">
          <span class="result-score-percent">${result.score}%</span>
          <span class="result-score-label">${result.certificate ? 'Certified (≥75%)' : 'Needs ≥75%'}</span>
        </div>
      </div>

      ${certificateCardHtml}

      ${improvementRoadmapHtml}

      <div class="review-questions-list">
        <h4 style="font-size:1.05rem; font-weight:800; color:#ffffff; margin: 1.5rem 0 1rem;">Detailed Question-by-Question Analysis</h4>
        ${reviewItemsHtml}
      </div>

      <div class="panel-footer-actions" style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
        <button type="button" class="dash-btn outline" id="jumpToResumeBtn">
          <span>📄 Open Resume Builder &amp; Add Certificate →</span>
        </button>
      </div>
    `;

    scoringOutputPanel.classList.remove('hidden');

    // Bind Result Card Buttons
    const viewCertFromResultsBtn = document.getElementById('viewCertFromResultsBtn');
    if (viewCertFromResultsBtn && result.certificate) {
      viewCertFromResultsBtn.addEventListener('click', () => {
        openCertificateModal(result.certificate);
      });
    }

    const retakeAssessmentFromCardBtn = document.getElementById('retakeAssessmentFromCardBtn');
    if (retakeAssessmentFromCardBtn) {
      retakeAssessmentFromCardBtn.addEventListener('click', () => {
        const target = document.getElementById('step2WorkflowCard') || document.getElementById('assessmentForm');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    const adoptImprovementBtn = document.getElementById('adoptImprovementBtn');
    if (adoptImprovementBtn && result.improvement_roadmap) {
      adoptImprovementBtn.addEventListener('click', async () => {
        try {
          await fetch('/api/v1/roadmap/adopt-improvement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domain_id: state.selectedDomain,
              steps: result.improvement_roadmap.steps
            })
          });

          // Update local roadmap steps
          state.roadmapSteps = result.improvement_roadmap.steps.map((s, idx) => ({
            id: idx + 1,
            title: s.title,
            desc: s.desc,
            domain: s.domain,
            url: s.resource_url,
            urlLabel: 'Reference Resource',
            status: 'pending'
          }));

          renderRoadmap();
          switchView('roadmap');
          showToast('Improvement Roadmap Adopted', 'Synced targeted remediation milestones into your active roadmap.', 'success');
        } catch (e) {
          switchView('roadmap');
        }
      });
    }

    const jumpToResumeBtn = document.getElementById('jumpToResumeBtn');
    if (jumpToResumeBtn) {
      jumpToResumeBtn.addEventListener('click', () => {
        switchView('resume');
        showToast('Resume Builder', 'Your verified certificate is ready to include in your resume.', 'info');
      });
    }
  }

  // Opens the official technical certificate modal
  function openCertificateModal(certData) {
    const cert = certData || state.userCertificates?.[0] || {
      recipient_name: state.user.name,
      domain_name: state.domainData.domain?.name || 'AI & Autonomous Agents',
      score: 90,
      grade: 'Honor Roll (A+)',
      verification_code: 'VRF-NX-90-A882',
      issued_at: new Date().toISOString()
    };

    const certModalRecipient = document.getElementById('certModalRecipient');
    const certModalDomain = document.getElementById('certModalDomain');
    const certModalScore = document.getElementById('certModalScore');
    const certModalGrade = document.getElementById('certModalGrade');
    const certModalVerificationId = document.getElementById('certModalVerificationId');
    const certModalDate = document.getElementById('certModalDate');

    if (certModalRecipient) certModalRecipient.textContent = cert.recipient_name || state.user.name;
    if (certModalDomain) certModalDomain.textContent = cert.domain_name || state.domainData.domain?.name;
    if (certModalScore) certModalScore.textContent = `${cert.score}%`;
    if (certModalGrade) certModalGrade.textContent = cert.grade || (cert.score >= 90 ? 'Honor Roll (A+)' : cert.score >= 80 ? 'Distinction (A)' : 'Proficient');
    if (certModalVerificationId) certModalVerificationId.textContent = cert.verification_code || 'VRF-NX-2026';
    if (certModalDate) {
      const d = cert.issued_at ? new Date(cert.issued_at) : new Date();
      certModalDate.textContent = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    openModal(certificateModal);
  }

  // =========================================================================
  // Resume Builder Module (Based on Educational Qualification & Domain Certs)
  // =========================================================================
  function initResumeBuilder() {
    // Input elements
    const resEduDegree = document.getElementById('resEduDegree');
    const resEduInstitution = document.getElementById('resEduInstitution');
    const resEduGradYear = document.getElementById('resEduGradYear');
    const resEduGpa = document.getElementById('resEduGpa');
    const resEduCoursework = document.getElementById('resEduCoursework');
    const resEduHonors = document.getElementById('resEduHonors');

    const resFullName = document.getElementById('resFullName');
    const resTargetRole = document.getElementById('resTargetRole');
    const resEmail = document.getElementById('resEmail');
    const resPhone = document.getElementById('resPhone');
    const resLocation = document.getElementById('resLocation');
    const resPortfolio = document.getElementById('resPortfolio');
    const resSummary = document.getElementById('resSummary');

    const resSkillsLangs = document.getElementById('resSkillsLangs');
    const resSkillsFrameworks = document.getElementById('resSkillsFrameworks');
    const resSkillsCloud = document.getElementById('resSkillsCloud');

    // Preview elements
    const previewName = document.getElementById('previewName');
    const previewRole = document.getElementById('previewRole');
    const previewEmail = document.getElementById('previewEmail');
    const previewPhone = document.getElementById('previewPhone');
    const previewLocation = document.getElementById('previewLocation');
    const previewPortfolio = document.getElementById('previewPortfolio');
    const previewSummary = document.getElementById('previewSummary');

    const previewInstitution = document.getElementById('previewInstitution');
    const previewDegree = document.getElementById('previewDegree');
    const previewGradYear = document.getElementById('previewGradYear');
    const previewGpa = document.getElementById('previewGpa');
    const previewCoursework = document.getElementById('previewCoursework');
    const previewHonors = document.getElementById('previewHonors');

    const previewLangs = document.getElementById('previewLangs');
    const previewFrameworks = document.getElementById('previewFrameworks');
    const previewCloud = document.getElementById('previewCloud');

    // Real-time two-way reactive binding helper
    function bindInput(inputEl, previewEl, prefix = '') {
      if (!inputEl || !previewEl) return;
      inputEl.addEventListener('input', () => {
        previewEl.textContent = prefix + inputEl.value;
      });
    }

    bindInput(resFullName, previewName);
    bindInput(resTargetRole, previewRole);
    bindInput(resEmail, previewEmail);
    bindInput(resPhone, previewPhone);
    bindInput(resLocation, previewLocation);
    bindInput(resPortfolio, previewPortfolio);
    bindInput(resSummary, previewSummary);

    bindInput(resEduInstitution, previewInstitution);
    bindInput(resEduDegree, previewDegree);
    bindInput(resEduGradYear, previewGradYear);
    bindInput(resEduGpa, previewGpa);
    bindInput(resEduCoursework, previewCoursework, 'Key Coursework: ');
    bindInput(resEduHonors, previewHonors, '• ');

    bindInput(resSkillsLangs, previewLangs);
    bindInput(resSkillsFrameworks, previewFrameworks);
    bindInput(resSkillsCloud, previewCloud);

    // Sync certificates
    syncCertificatesToResume();

    // AI Enhance Resume with Gemini API Backend
    if (aiEnhanceResumeBtn) {
      aiEnhanceResumeBtn.addEventListener('click', async () => {
        const originalText = aiEnhanceResumeBtn.innerHTML;
        aiEnhanceResumeBtn.innerHTML = '<span>✨ Gemini Optimizing...</span>';
        aiEnhanceResumeBtn.disabled = true;

        try {
          const res = await fetch('/api/v1/ai/generate-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: resFullName ? resFullName.value : 'Alex Morgan',
              email: resEmail ? resEmail.value : 'alex.developer@hackathon.dev',
              phone: resPhone ? resPhone.value : '+1 (555) 438-9021',
              target_role: resTargetRole ? resTargetRole.value : 'AI Systems Architect',
              education_details: {
                degree: resEduDegree ? resEduDegree.value : 'M.S. in Computer Science',
                institution: resEduInstitution ? resEduInstitution.value : 'Stanford University',
                grad_year: resEduGradYear ? resEduGradYear.value : '2025',
                gpa: resEduGpa ? resEduGpa.value : '3.92 / 4.0 GPA',
                coursework: resEduCoursework ? resEduCoursework.value : 'Distributed Systems'
              },
              skills: resSkillsLangs ? resSkillsLangs.value : 'Python, TypeScript',
              certificates: state.userCertificates || []
            })
          });

          const data = await res.json();
          aiEnhanceResumeBtn.innerHTML = originalText;
          aiEnhanceResumeBtn.disabled = false;

          if (data && data.resume) {
            const r = data.resume;
            if (r.executive_summary) {
              if (resSummary) resSummary.value = r.executive_summary;
              if (previewSummary) previewSummary.textContent = r.executive_summary;
            }

            const atsScoreVal = document.getElementById('atsScoreValue');
            if (atsScoreVal) atsScoreVal.textContent = `${r.ats_score || 98}%`;

            showToast('Resume Enhanced', `Gemini generated executive summary and ATS optimization (${r.ats_score || 98}% match).`, 'success');
          }
        } catch (err) {
          aiEnhanceResumeBtn.innerHTML = originalText;
          aiEnhanceResumeBtn.disabled = false;
          console.error('Resume AI enhancement failed:', err);
        }
      });
    }

    // Print Resume Button
    if (printResumeBtn) {
      printResumeBtn.addEventListener('click', () => {
        document.body.classList.remove('printing-cert');
        window.print();
      });
    }

    // Save Resume to Profile
    if (saveResumeBtn) {
      saveResumeBtn.addEventListener('click', async () => {
        try {
          await fetch('/api/v1/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              education: `${resEduDegree?.value || ''} - ${resEduInstitution?.value || ''}`,
              target_role: resTargetRole?.value || 'AI Systems Architect',
              bio: resSummary?.value || ''
            })
          });
          showToast('Resume Profile Saved', 'Educational qualifications & target role persisted.', 'success');
        } catch (e) {
          showToast('Saved Locally', 'Resume qualifications ready for PDF export.', 'info');
        }
      });
    }

    if (refreshResumePreviewBtn) {
      refreshResumePreviewBtn.addEventListener('click', () => {
        syncCertificatesToResume();
        showToast('Preview Refreshed', 'A4 resume preview synchronized.', 'info');
      });
    }
  }

  function syncCertificatesToResume() {
    const resCertsList = document.getElementById('resCertsList');
    const previewCertsList = document.getElementById('previewCertsList');
    if (!resCertsList && !previewCertsList) return;

    const certs = state.userCertificates && state.userCertificates.length > 0 ? state.userCertificates : [
      {
        id: 'CERT-NX-2026-AI01',
        domain_name: 'AI & Autonomous Agents',
        score: 90,
        grade: 'Honor Roll (A+)',
        verification_code: 'VRF-NX-90-A882'
      }
    ];

    if (resCertsList) {
      resCertsList.innerHTML = certs.map(c => `
        <div class="res-cert-pill">
          <div>
            <strong>${c.domain_name}</strong>
            <small style="display:block; color:#94a3b8">Credential: ${c.verification_code || c.id}</small>
          </div>
          <span>${c.score}% Proficiency</span>
        </div>
      `).join('');
    }

    if (previewCertsList) {
      previewCertsList.innerHTML = certs.map(c => `
        <div class="a4-cert-entry">
          <div class="a4-row-between">
            <strong class="a4-cert-title">Certified Specialist: ${c.domain_name}</strong>
            <span class="a4-cert-score">${c.score}% Proficiency (${c.grade || 'Verified'})</span>
          </div>
          <div class="a4-cert-meta">
            Credential ID: <code>${c.verification_code || c.id}</code> • Verified by CareerVista Standards Board
          </div>
        </div>
      `).join('');
    }
  }

  // =========================================================================
  // Resume Suite Tabs & Gemini ATS Resume Checker
  // =========================================================================
  function activateResumeTab(tab) {
    const tabBuilder = document.getElementById('tabResumeBuilder');
    const tabChecker = document.getElementById('tabResumeChecker');
    const builderGrid = document.getElementById('resumeBuilderGrid');
    const checkerPane = document.getElementById('resumeCheckerPane');

    if (!tabBuilder || !tabChecker) return;

    if (tab === 'checker') {
      tabChecker.classList.add('active');
      tabBuilder.classList.remove('active');
      if (checkerPane) checkerPane.classList.remove('hidden');
      if (builderGrid) builderGrid.classList.add('hidden');
    } else {
      tabBuilder.classList.add('active');
      tabChecker.classList.remove('active');
      if (builderGrid) builderGrid.classList.remove('hidden');
      if (checkerPane) checkerPane.classList.add('hidden');
    }
  }

  function initResumeChecker() {
    const tabBuilder = document.getElementById('tabResumeBuilder');
    const tabChecker = document.getElementById('tabResumeChecker');
    if (tabBuilder) tabBuilder.addEventListener('click', () => activateResumeTab('builder'));
    if (tabChecker) tabChecker.addEventListener('click', () => activateResumeTab('checker'));

    const checkerFileInput = document.getElementById('checkerFileInput');
    const checkerPullBtn = document.getElementById('checkerPullFromBuilderBtn');
    const checkerLoadSampleBtn = document.getElementById('checkerLoadSampleBtn');
    const checkerTryDemoBtn = document.getElementById('checkerTryDemoBtn');
    const checkerClearBtn = document.getElementById('checkerClearBtn');
    const runResumeCheckBtn = document.getElementById('runResumeCheckBtn');
    const checkerResumeText = document.getElementById('checkerResumeText');
    const checkerJobDesc = document.getElementById('checkerJobDesc');
    const checkerTargetRole = document.getElementById('checkerTargetRole');
    const checkerDomainSelect = document.getElementById('checkerDomainSelect');
    const checkerWordCountHint = document.getElementById('checkerWordCountHint');

    const checkerEmptyState = document.getElementById('checkerEmptyState');
    const checkerLoadingState = document.getElementById('checkerLoadingState');
    const checkerResultsBody = document.getElementById('checkerResultsBody');

    // Live word counter
    function updateWordCount() {
      if (!checkerResumeText || !checkerWordCountHint) return;
      const text = checkerResumeText.value.trim();
      if (!text) {
        checkerWordCountHint.textContent = '0 words';
        return;
      }
      const words = text.split(/\s+/).filter(Boolean).length;
      const chars = text.length;
      checkerWordCountHint.textContent = `${words} words (${chars} chars)`;
    }

    if (checkerResumeText) {
      checkerResumeText.addEventListener('input', updateWordCount);
    }

    // Sample Resume Content
    const sampleResume = `ALEX MORGAN
Email: alex.developer@hackathon.dev | Phone: +1 (555) 019-2834 | GitHub: github.com/alexmorgan | LinkedIn: linkedin.com/in/alexmorgan

PROFESSIONAL SUMMARY
Senior Full-Stack Engineer & Distributed Systems Developer with 5+ years of experience building high-concurrency cloud architectures, event-driven microservices, and AI-enabled platforms. Proven track record optimizing latency, improving developer productivity, and scaling zero-trust distributed backends.

EDUCATION
Master of Science in Computer Science & Distributed Systems
Stanford University | 2023 – 2025 | GPA: 3.92 / 4.0
Honors: Dean's Honor List • Graduate Research Fellow in Autonomous Agent State Graphs & RAG

TECHNICAL SKILLS
Languages: Python, TypeScript, JavaScript, SQL, Rust, Go, HTML5, CSS3
Frameworks & Libraries: React 19, Next.js 15, Node.js, FastAPI, Express.js, PyTorch, TailwindCSS
Cloud & Infrastructure: Docker, Kubernetes, AWS (ECS, Lambda, S3, CloudFront), Terraform, GitHub Actions CI/CD
Databases & Caching: PostgreSQL, Redis, ClickHouse, SQLite, Vector Databases (Qdrant, Pinecone)
Concepts: RESTful APIs, GraphQL, WebSockets, Event-Driven Architecture, Microservices, Asymmetric RS256 Auth, Zero-Trust

PROFESSIONAL EXPERIENCE
Senior Software Engineer | CloudScale Systems | 2023 – Present
- Worked on backend microservices handling high traffic and improved response times.
- Handled PostgreSQL query bottlenecks and added caching to speed up user dashboard.
- Assisted with Kubernetes migrations and automated deployments with GitHub Actions.
- Participated in team code reviews, agile sprints, and mentored junior engineers on TypeScript.

Full-Stack Developer | InnovateTech Labs | 2021 – 2023
- Developed customer-facing web applications using React and Node.js REST APIs.
- Responsible for adding user authentication with JWT tokens and session security.
- Fixed frontend performance bugs and reduced page load times across the application.
- Collaborated with product designers to implement responsive UI components.

SELECTED PROJECTS
CareerVista AI Autonomous Orchestration Engine | TypeScript, Next.js 15, Python, LangGraph
- Designed an asynchronous multi-agent DAG runner reducing end-to-end task completion latency by 42%.
- Implemented append-only state checkpointing with SQLite enabling instant rollback and human-in-the-loop tool intervention.

Quantum Vault Zero-Knowledge Identity Gate | Rust, WebAssembly, zk-SNARKs, OAuth 2.1
- Built in-browser WASM cryptographic circuits allowing users to prove credential validity without revealing sensitive data.
- Secured edge API endpoints with asymmetric RS256 token verification and HttpOnly SameSite cookie guards.

VERIFIED CERTIFICATIONS
- Certified Specialist: AI & Autonomous Agents (Score: 90%, CareerVista Global Technical Board)`;

    function loadSample() {
      if (checkerResumeText) {
        checkerResumeText.value = sampleResume;
        updateWordCount();
      }
      if (checkerTargetRole) checkerTargetRole.value = 'Senior Full Stack Engineer';
      if (checkerDomainSelect) checkerDomainSelect.value = 'fullstack';
      if (checkerJobDesc) {
        checkerJobDesc.value = 'Looking for a Senior Full-Stack Engineer skilled in TypeScript, React, Next.js, Node.js, PostgreSQL, Docker, AWS, Kubernetes, and CI/CD pipelines. Experience in microservices and distributed caching required.';
      }
      showToast('Sample Resume Loaded', 'Realistic senior engineer resume loaded into checker.', 'info');
    }

    if (checkerLoadSampleBtn) checkerLoadSampleBtn.addEventListener('click', loadSample);
    if (checkerTryDemoBtn) checkerTryDemoBtn.addEventListener('click', loadSample);

    // Pull from Resume Builder
    if (checkerPullBtn) {
      checkerPullBtn.addEventListener('click', () => {
        const name = document.getElementById('resFullName')?.value || state.user.name || 'Alex Morgan';
        const email = document.getElementById('resEmail')?.value || state.user.email || 'alex@careervista.dev';
        const role = document.getElementById('resTitle')?.value || state.user.targetRole || 'Full-Stack Architect';
        const degree = document.getElementById('resEduDegree')?.value || state.educationDetails.degree;
        const inst = document.getElementById('resEduInstitution')?.value || state.educationDetails.institution;
        const gpa = document.getElementById('resEduGpa')?.value || state.educationDetails.gpa;
        const coursework = document.getElementById('resEduCoursework')?.value || state.educationDetails.coursework;
        const summary = document.getElementById('resSummary')?.value || 'Engineering specialist with proven expertise.';
        const langs = document.getElementById('resSkillsLangs')?.value || 'Python, TypeScript, SQL';
        const frameworks = document.getElementById('resSkillsFrameworks')?.value || 'React, Next.js, FastAPI';
        const cloud = document.getElementById('resSkillsCloud')?.value || 'Docker, AWS, PostgreSQL';

        const compiled = `${name.toUpperCase()}
Email: ${email} | Title: ${role}

PROFESSIONAL SUMMARY
${summary}

EDUCATION
${degree}
${inst} | GPA: ${gpa}
Relevant Coursework: ${coursework}

TECHNICAL SKILLS
- Languages: ${langs}
- Frameworks & Web: ${frameworks}
- Cloud & Infrastructure: ${cloud}

SELECTED PROJECTS & CREDENTIALS
- CareerVista AI Autonomous Orchestration Engine: Designed stateful DAG runner reducing latency by 42%.
- Verified Assessment: ${state.userCertificates[0]?.domain_name || 'AI & Autonomous Agents'} (${state.userCertificates[0]?.score || 90}% Proficiency)`;

        if (checkerResumeText) {
          checkerResumeText.value = compiled;
          updateWordCount();
        }
        if (checkerTargetRole) checkerTargetRole.value = role;
        showToast('Imported from Builder', 'Current resume details populated into checker.', 'success');
      });
    }

    // File Upload Handler
    if (checkerFileInput) {
      checkerFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const contents = event.target.result;
          if (contents && typeof contents === 'string') {
            if (checkerResumeText) {
              checkerResumeText.value = contents;
              updateWordCount();
            }
            showToast('Resume File Read', `Loaded ${file.name} successfully (${file.size} bytes).`, 'success');
          }
        };
        reader.onerror = () => {
          showToast('File Read Error', 'Unable to parse file. Please paste text directly.', 'error');
        };
        reader.readAsText(file);
      });
    }

    // Clear Button
    if (checkerClearBtn) {
      checkerClearBtn.addEventListener('click', () => {
        if (checkerResumeText) checkerResumeText.value = '';
        if (checkerJobDesc) checkerJobDesc.value = '';
        updateWordCount();
        if (checkerEmptyState) checkerEmptyState.classList.remove('hidden');
        if (checkerLoadingState) checkerLoadingState.classList.add('hidden');
        if (checkerResultsBody) checkerResultsBody.classList.add('hidden');
        showToast('Cleared', 'Checker inputs cleared.', 'info');
      });
    }

    // Run Resume Check
    if (runResumeCheckBtn) {
      runResumeCheckBtn.addEventListener('click', async () => {
        const text = checkerResumeText ? checkerResumeText.value.trim() : '';
        if (!text || text.split(/\s+/).filter(Boolean).length < 15) {
          showToast('Resume Too Short', 'Please paste at least 15-20 words of resume content to analyze.', 'warning');
          checkerResumeText?.focus();
          return;
        }

        const targetRole = checkerTargetRole ? checkerTargetRole.value.trim() : 'Software Engineer';
        const domain = checkerDomainSelect ? checkerDomainSelect.value : 'fullstack';
        const jobDesc = checkerJobDesc ? checkerJobDesc.value.trim() : '';

        // Switch to loading UI
        if (checkerEmptyState) checkerEmptyState.classList.add('hidden');
        if (checkerResultsBody) checkerResultsBody.classList.add('hidden');
        if (checkerLoadingState) checkerLoadingState.classList.remove('hidden');

        const originalBtnHtml = runResumeCheckBtn.innerHTML;
        runResumeCheckBtn.innerHTML = '<span>⚡ Gemini AI Auditing...</span>';
        runResumeCheckBtn.disabled = true;

        try {
          const res = await fetch('/api/v1/resume/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              resume_text: text,
              target_role: targetRole,
              domain: domain,
              job_description: jobDesc
            })
          });

          const data = await res.json();
          runResumeCheckBtn.innerHTML = originalBtnHtml;
          runResumeCheckBtn.disabled = false;

          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Failed to analyze resume.');
          }

          const resultObj = data.analysis || data.result || data;
          renderCheckerResults(resultObj, data.target_role || targetRole);
          showToast('ATS Audit Complete!', `Resume scored ${resultObj.ats_score || 75}% (${resultObj.grade || 'Verified'}).`, 'success');
        } catch (err) {
          runResumeCheckBtn.innerHTML = originalBtnHtml;
          runResumeCheckBtn.disabled = false;
          console.error('Resume checker error:', err);
          if (checkerLoadingState) checkerLoadingState.classList.add('hidden');
          if (checkerEmptyState) checkerEmptyState.classList.remove('hidden');
          showToast('Analysis Error', err.message || 'Could not complete resume check.', 'error');
        }
      });
    }

    function renderCheckerResults(r, targetRoleFallback) {
      if (checkerLoadingState) checkerLoadingState.classList.add('hidden');
      if (checkerEmptyState) checkerEmptyState.classList.add('hidden');
      if (checkerResultsBody) checkerResultsBody.classList.remove('hidden');

      const score = Math.max(0, Math.min(100, Math.round(r.ats_score || 75)));

      // 1. Hero Gauge
      const scoreVal = document.getElementById('atsScoreValue');
      const scoreCircle = document.getElementById('atsScoreCircle');
      const gradeBadge = document.getElementById('atsGradeBadge');
      const targetBadge = document.getElementById('atsTargetBadge');
      const summaryTitle = document.getElementById('atsSummaryTitle');
      const summaryDesc = document.getElementById('atsSummaryDesc');

      if (scoreVal) scoreVal.textContent = `${score}%`;
      if (scoreCircle) {
        // Circumference for r=42 is ~264
        const offset = 264 - (264 * (score / 100));
        scoreCircle.style.strokeDashoffset = offset;
        if (score >= 85) scoreCircle.style.stroke = '#22c55e';
        else if (score >= 70) scoreCircle.style.stroke = '#06b6d4';
        else if (score >= 55) scoreCircle.style.stroke = '#f59e0b';
        else scoreCircle.style.stroke = '#ef4444';
      }

      if (gradeBadge) {
        gradeBadge.textContent = r.grade || 'Competitive';
        if (score >= 85) {
          gradeBadge.style.background = 'rgba(34, 197, 94, 0.18)';
          gradeBadge.style.color = '#4ade80';
          gradeBadge.style.borderColor = 'rgba(34, 197, 94, 0.35)';
        } else if (score >= 70) {
          gradeBadge.style.background = 'rgba(6, 182, 212, 0.18)';
          gradeBadge.style.color = '#22d3ee';
          gradeBadge.style.borderColor = 'rgba(6, 182, 212, 0.35)';
        } else {
          gradeBadge.style.background = 'rgba(245, 158, 11, 0.18)';
          gradeBadge.style.color = '#fbbf24';
          gradeBadge.style.borderColor = 'rgba(245, 158, 11, 0.35)';
        }
      }

      if (targetBadge) {
        targetBadge.textContent = r.target_role || targetRoleFallback || 'Target Role';
      }

      if (summaryTitle) {
        summaryTitle.textContent = r.summary_headline || (score >= 80 ? 'High ATS Match with Optimization Opportunities' : 'Competitive Foundation Requiring Keyword & Impact Polish');
      }

      if (summaryDesc) {
        summaryDesc.textContent = r.overall_assessment || r.summary_narrative || 'Resume has been evaluated against high-frequency industry ATS parsing models.';
      }

      // 2. 4 Breakdown bars
      const bd = r.score_breakdown || r.breakdown || {};
      const kwVal = bd.keyword_match ?? bd.keyword_score ?? Math.round(score * 0.95);
      const impVal = bd.impact_metrics ?? bd.impact_score ?? Math.round(score * 0.85);
      const fmtVal = bd.structure_formatting ?? bd.formatting_score ?? 90;
      const vrbVal = bd.technical_depth ?? bd.action_verb_score ?? Math.round(score * 0.9);

      setBar('barKeywordVal', 'barKeywordFill', kwVal);
      setBar('barImpactVal', 'barImpactFill', impVal);
      setBar('barFormatVal', 'barFormatFill', fmtVal);
      setBar('barVerbVal', 'barVerbFill', vrbVal);

      // 3. Missing Keywords
      const kwList = document.getElementById('checkerMissingKeywordsList');
      const kwCount = document.getElementById('checkerMissingCount');
      const missingKws = r.missing_keywords || [];

      if (kwCount) {
        kwCount.textContent = `${missingKws.length} Missing`;
      }

      if (kwList) {
        if (missingKws.length === 0) {
          kwList.innerHTML = `<span style="color:#4ade80; font-size:0.85rem;">🎉 Outstanding! All core domain technical keywords are present.</span>`;
        } else {
          kwList.innerHTML = missingKws.map(kw => `
            <button type="button" class="missing-kw-pill" title="Click to insert into Technical Skills" data-kw="${kw}">
              <span>${kw}</span>
              <span class="pill-plus">+ Add</span>
            </button>
          `).join('');

          // Click pill to insert keyword into resume textarea
          kwList.querySelectorAll('.missing-kw-pill').forEach(pill => {
            pill.addEventListener('click', () => {
              const kwToAdd = pill.getAttribute('data-kw');
              if (!kwToAdd || !checkerResumeText) return;

              let currentText = checkerResumeText.value;
              if (currentText.includes('TECHNICAL SKILLS')) {
                currentText = currentText.replace(/TECHNICAL SKILLS[^\n]*\n/, match => `${match}${kwToAdd}, `);
              } else {
                currentText += `\n\nTECHNICAL SKILLS: ${kwToAdd}`;
              }
              checkerResumeText.value = currentText;
              updateWordCount();
              pill.style.opacity = '0.4';
              pill.style.pointerEvents = 'none';
              showToast('Keyword Added', `Added "${kwToAdd}" into resume text!`, 'success');
            });
          });
        }
      }

      // 4. Strengths & Weaknesses
      const strengthsList = document.getElementById('checkerStrengthsList');
      const weaknessesList = document.getElementById('checkerWeaknessesList');

      if (strengthsList) {
        const strengths = r.top_strengths || ['Well-structured educational credentials', 'Clear technical stack breakdown'];
        strengthsList.innerHTML = strengths.map(s => `<li>${s}</li>`).join('');
      }

      if (weaknessesList) {
        const weaknesses = r.areas_to_improve || ['Add quantified metrics (%, ms, $) to experience bullets', 'Incorporate missing domain keywords'];
        weaknessesList.innerHTML = weaknesses.map(w => `<li>${w}</li>`).join('');
      }

      // 4.5. Industry Capabilities (What You Are Capable of Doing in the Industry)
      const indCap = r.industry_capabilities || {};
      const indCapTitle = document.getElementById('indCapTitle');
      const indCapSummary = document.getElementById('indCapSummary');
      const indCapRolesList = document.getElementById('indCapRolesList');
      const indCapDeliverablesGrid = document.getElementById('indCapDeliverablesGrid');
      const indCapBusinessImpact = document.getElementById('indCapBusinessImpact');

      if (indCapTitle && indCap.headline) {
        indCapTitle.textContent = indCap.headline;
      }
      if (indCapSummary && indCap.summary) {
        indCapSummary.textContent = indCap.summary;
      }

      if (indCapRolesList) {
        const roles = Array.isArray(indCap.capable_roles) && indCap.capable_roles.length
          ? indCap.capable_roles
          : [targetRoleFallback || 'Senior Software Engineer', 'Distributed Systems Architect', 'Platform Infrastructure Engineer'];
        indCapRolesList.innerHTML = roles.map(role => `
          <span class="ind-role-chip">
            <span class="role-chip-dot"></span>
            <strong>${role}</strong>
          </span>
        `).join('');
      }

      if (indCapDeliverablesGrid) {
        const deliverables = Array.isArray(indCap.what_you_can_build) && indCap.what_you_can_build.length
          ? indCap.what_you_can_build
          : [
              'Architect and ship high-throughput, low-latency applications handling 10k+ concurrent requests with sub-50ms p99 latency.',
              'Design resilient microservices and distributed data pipelines with automated circuit breaking and message queues.',
              'Implement secure, zero-trust API authentication gateways with cryptographic token verification and audit logging.',
              'Automate CI/CD deployment pipelines, containerized orchestration, and multi-cloud infrastructure with automated rollbacks.'
            ];
        indCapDeliverablesGrid.innerHTML = deliverables.map((item, idx) => `
          <div class="ind-deliverable-item">
            <div class="deliverable-icon-num">${idx + 1}</div>
            <div class="deliverable-content">
              <p>${item}</p>
            </div>
          </div>
        `).join('');
      }

      if (indCapBusinessImpact && indCap.business_impact) {
        indCapBusinessImpact.textContent = indCap.business_impact;
      }

      // 5. Gemini AI Bullet Rewrites
      const rewritesList = document.getElementById('checkerRewritesList');
      const rewrites = r.bullet_rewrites || [];

      if (rewritesList) {
        if (rewrites.length === 0) {
          rewritesList.innerHTML = `<p style="color:#94a3b8; font-size:0.85rem;">No critical bullet rewrites flagged. Your experience statements are well quantified.</p>`;
        } else {
          rewritesList.innerHTML = rewrites.map((item, idx) => `
            <div class="rewrite-card">
              <div class="rewrite-row">
                <span class="rewrite-tag before">Original Bullet #${idx + 1}</span>
                <p class="rewrite-text">"${item.original_bullet || item.original || ''}"</p>
              </div>
              <div class="rewrite-row">
                <span class="rewrite-tag after">Gemini AI Optimized (XYZ Formula)</span>
                <p class="rewrite-text polished">${item.improved_bullet || item.improved || ''}</p>
                <span class="rewrite-reason">💡 Reason: ${item.reason_for_improvement || item.reason || 'Quantified business impact and active technical verbs.'}</span>
              </div>
              <div class="rewrite-actions">
                <button type="button" class="btn-mini-tool copy-rewrite-btn" data-text="${(item.improved_bullet || item.improved || '').replace(/"/g, '&quot;')}">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <span>Copy Rewrite</span>
                </button>
                <button type="button" class="btn-mini-tool primary-subtle apply-builder-btn" data-text="${(item.improved_bullet || item.improved || '').replace(/"/g, '&quot;')}">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Apply to Builder</span>
                </button>
              </div>
            </div>
          `).join('');

          // Copy rewrite listener
          rewritesList.querySelectorAll('.copy-rewrite-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const t = btn.getAttribute('data-text');
              if (t) {
                navigator.clipboard.writeText(t).catch(() => {});
                showToast('Copied to Clipboard', 'Optimized bullet ready to paste.', 'success');
              }
            });
          });

          // Apply to builder listener
          rewritesList.querySelectorAll('.apply-builder-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const t = btn.getAttribute('data-text');
              if (t) {
                const b1 = document.getElementById('resProj1Bullet1');
                if (b1) {
                  b1.value = t;
                  // Trigger input event to update live A4 preview
                  b1.dispatchEvent(new Event('input', { bubbles: true }));
                }
                activateResumeTab('builder');
                showToast('Applied to Builder', 'Updated Project Bullet #1 with optimized statement!', 'success');
              }
            });
          });
        }
      }

      // 6. Action Plan
      const actionPlanList = document.getElementById('checkerActionPlanList');
      const actionPlan = r.action_plan || [
        'Add the missing keywords to your Technical Skills section.',
        'Replace passive experience bullets with the Gemini XYZ rewrites.',
        'Save and export your verified ATS PDF directly from the Resume Builder.'
      ];

      if (actionPlanList) {
        actionPlanList.innerHTML = actionPlan.map((step, idx) => `
          <div class="plan-step-box">
            <span class="step-num-bubble">${idx + 1}</span>
            <p class="plan-step-text">${step}</p>
          </div>
        `).join('');
      }
    }

    function setBar(valId, fillId, val) {
      const vEl = document.getElementById(valId);
      const fEl = document.getElementById(fillId);
      const cleanVal = Math.max(0, Math.min(100, Math.round(val)));
      if (vEl) vEl.textContent = `${cleanVal}%`;
      if (fEl) fEl.style.width = `${cleanVal}%`;
    }
  }

  // Domain selection listeners on Assessment page
  document.querySelectorAll('.domain-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const dId = btn.getAttribute('data-domain');
      if (dId === 'other') {
        if (typeof window.focusDomainSearch === 'function') window.focusDomainSearch();
      } else if (dId) {
        selectDomain(dId, false);
      }
    });
  });

  // Domain selection listeners on Profile page (Interested Domains cloud)
  document.querySelectorAll('.interest-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const dId = btn.getAttribute('data-domain');
      if (dId === 'other') {
        switchView('assessment');
        setTimeout(() => {
          if (typeof window.focusDomainSearch === 'function') window.focusDomainSearch();
        }, 200);
      } else if (dId) {
        selectDomain(dId, true);
      }
    });
  });

  // Profile Action buttons
  const goToDomainAssessmentBtn = document.getElementById('goToDomainAssessmentBtn');
  if (goToDomainAssessmentBtn) {
    goToDomainAssessmentBtn.addEventListener('click', () => {
      switchView('assessment');
    });
  }

  const readArticlesQuickBtn = document.getElementById('readArticlesQuickBtn');
  if (readArticlesQuickBtn) {
    readArticlesQuickBtn.addEventListener('click', () => {
      switchView('assessment');
      const step1 = document.querySelector('.assessment-workflow-card');
      if (step1) step1.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const viewAssessmentResultsBtn = document.getElementById('viewAssessmentResultsBtn');
  if (viewAssessmentResultsBtn) {
    viewAssessmentResultsBtn.addEventListener('click', () => {
      switchView('assessment');
      if (scoringOutputPanel && !scoringOutputPanel.classList.contains('hidden')) {
        scoringOutputPanel.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // =========================================================================
  // 4. Universal "All Features" Dropdown Logic
  // =========================================================================
  if (featuresDropdownBtn && featuresDropdownWrapper) {
    featuresDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      featuresDropdownWrapper.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!featuresDropdownWrapper.contains(e.target)) {
        featuresDropdownWrapper.classList.remove('open');
      }
    });
  }

  const featureHandlers = {
    featResumeBuilder: () => {
      switchView('resume');
      activateResumeTab('builder');
      showToast('Resume Builder', 'Constructing executive resume based on educational qualifications.', 'info');
    },
    featResumeChecker: () => {
      switchView('resume');
      activateResumeTab('checker');
      showToast('Resume Checker', 'Gemini ATS audit & bullet optimizer ready.', 'info');
    },
    featViewCert: () => {
      openCertificateModal();
    },
    featGenerateGeminiQ: () => {
      switchView('assessment');
      regenerateGeminiQuestions();
    },
    featSignIn: () => {
      switchView('login');
      switchAuthTab('signin');
      showToast('Sign In', 'Switched to Sign In portal.', 'info');
    },
    featSignUp: () => {
      switchView('login');
      switchAuthTab('signup');
      showToast('Create Account', 'Switched to Registration portal.', 'info');
    },
    featDemoFill: () => applyDemoCredentials(),
    featForgot: () => openModal(forgotModal),
    featTogglePass: () => toggleAllPasswords(),
    featGoogle: () => performSocialLogin('Google'),
    featGithub: () => performSocialLogin('GitHub'),
    featApple: () => performSocialLogin('Apple'),
    featEditProfile: () => {
      switchView('profile');
      openModal(editProfileModal);
    },
    featSubmitProject: () => {
      switchView('profile');
      openModal(submitProjectModal);
    },
    featCopyToken: () => copyApiToken(),
    featOpenAiTutor: () => {
      switchView('profile');
      const tutorPanel = document.getElementById('aiTutorPanel');
      if (tutorPanel) tutorPanel.scrollIntoView({ behavior: 'smooth' });
      const chatInput = document.getElementById('aiChatInput');
      if (chatInput) chatInput.focus();
      showToast('AI Tutor Active', 'Ask questions or tap the microphone to talk with Gemini AI.', 'info');
    },
    featRunAssessment: () => {
      switchView('assessment');
      showToast('Domain Assessment', 'Study the reference articles and attend questions.', 'info');
    },
    featRegenRoadmap: () => {
      switchView('roadmap');
      regenerateRoadmap();
      showToast('Roadmap Reset', 'Generated new milestone progression steps.', 'success');
    },
    featToggleGlow: () => {
      if (ambientBg) {
        const isHidden = ambientBg.style.display === 'none';
        ambientBg.style.display = isHidden ? 'block' : 'none';
        showToast('Ambient Lighting', isHidden ? 'Ambient glow enabled' : 'Ambient glow disabled', 'info');
      }
    }
  };

  Object.keys(featureHandlers).forEach(featId => {
    const el = document.getElementById(featId);
    if (el) {
      el.addEventListener('click', () => {
        featureHandlers[featId]();
        if (featuresDropdownWrapper) featuresDropdownWrapper.classList.remove('open');
      });
    }
  });

  // Mobile drawer actions
  const mobileDemoFill = document.getElementById('mobileDemoFill');
  if (mobileDemoFill) mobileDemoFill.addEventListener('click', applyDemoCredentials);

  const mobileEditProfile = document.getElementById('mobileEditProfile');
  if (mobileEditProfile) mobileEditProfile.addEventListener('click', () => {
    switchView('profile');
    openModal(editProfileModal);
  });

  const mobileSubmitProject = document.getElementById('mobileSubmitProject');
  if (mobileSubmitProject) mobileSubmitProject.addEventListener('click', () => {
    switchView('profile');
    openModal(submitProjectModal);
  });

  const mobileLogout = document.getElementById('mobileLogout');
  if (mobileLogout) mobileLogout.addEventListener('click', handleLogout);

  // =========================================================================
  // 5. Notifications Dropdown
  // =========================================================================
  if (menuNotifBtn && notifDropdown) {
    menuNotifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== menuNotifBtn) {
        notifDropdown.classList.add('hidden');
      }
    });
  }

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', () => {
      document.querySelectorAll('.notif-item.unread').forEach(item => item.classList.remove('unread'));
      if (notifBadge) notifBadge.style.display = 'none';
      showToast('Notifications Cleared', 'All unread notifications marked as read.', 'info');
    });
  }

  // =========================================================================
  // 6. Authentication System Logic
  // =========================================================================
  const authCard = document.getElementById('authCard');
  const tabSignIn = document.getElementById('tabSignIn');
  const tabSignUp = document.getElementById('tabSignUp');
  const authTabs = document.querySelector('.auth-tabs');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');
  const signInForm = document.getElementById('signInForm');
  const signUpForm = document.getElementById('signUpForm');
  const signinEmail = document.getElementById('signinEmail');
  const signinPassword = document.getElementById('signinPassword');
  const signinSubmitBtn = document.getElementById('signinSubmitBtn');
  const noAccountNotice = document.getElementById('noAccountNotice');
  const noAccountNoticeMsg = document.getElementById('noAccountNoticeMsg');
  const switchToSignUpBtn = document.getElementById('switchToSignUpBtn');

  const signupName = document.getElementById('signupName');
  const signupEmail = document.getElementById('signupEmail');
  const signupPassword = document.getElementById('signupPassword');
  const signupDomain = document.getElementById('signupDomain');
  const signupCustomDomainWrap = document.getElementById('signupCustomDomainWrap');
  const signupCustomDomain = document.getElementById('signupCustomDomain');
  const termsAgree = document.getElementById('termsAgree');
  const signupSubmitBtn = document.getElementById('signupSubmitBtn');
  const passwordMeter = document.getElementById('passwordMeter');
  const meterText = document.getElementById('meterText');
  const demoAutoFillBtn = document.getElementById('demoAutoFillBtn');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (authCard) {
    authCard.addEventListener('mousemove', (e) => {
      const rect = authCard.getBoundingClientRect();
      authCard.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      authCard.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
  }

  function switchAuthTab(target) {
    clearErrors();
    if (noAccountNotice) noAccountNotice.classList.add('hidden');

    if (target === 'signin') {
      authTabs.removeAttribute('data-active');
      tabSignIn.classList.add('active');
      tabSignIn.setAttribute('aria-selected', 'true');
      tabSignUp.classList.remove('active');
      tabSignUp.setAttribute('aria-selected', 'false');
      signInForm.classList.remove('hidden');
      signUpForm.classList.add('hidden');
      authTitle.textContent = 'Welcome back';
      authSubtitle.textContent = 'Enter your credentials to access the hackathon portal';
      if (signinEmail) signinEmail.focus();
    } else {
      authTabs.setAttribute('data-active', 'signup');
      tabSignUp.classList.add('active');
      tabSignUp.setAttribute('aria-selected', 'true');
      tabSignIn.classList.remove('active');
      tabSignIn.setAttribute('aria-selected', 'false');
      signUpForm.classList.remove('hidden');
      signInForm.classList.add('hidden');
      authTitle.textContent = 'Create an account';
      authSubtitle.textContent = 'Join the internal hackathon and choose your domain track';
      if (signupName) signupName.focus();
    }
  }

  if (tabSignIn) tabSignIn.addEventListener('click', () => switchAuthTab('signin'));
  if (tabSignUp) tabSignUp.addEventListener('click', () => switchAuthTab('signup'));

  if (switchToSignUpBtn) {
    switchToSignUpBtn.addEventListener('click', () => {
      if (signinEmail && signinEmail.value.trim() && signupEmail) {
        signupEmail.value = signinEmail.value.trim();
      }
      switchAuthTab('signup');
    });
  }

  if (signupDomain) {
    signupDomain.addEventListener('change', () => {
      clearFieldError('signupDomain');
      if (signupDomain.value === 'other') {
        if (signupCustomDomainWrap) signupCustomDomainWrap.classList.remove('hidden');
        if (signupCustomDomain) signupCustomDomain.focus();
      } else {
        if (signupCustomDomainWrap) signupCustomDomainWrap.classList.add('hidden');
      }
    });
  }

  document.querySelectorAll('.password-toggle').forEach((toggleBtn) => {
    toggleBtn.addEventListener('click', () => {
      const targetId = toggleBtn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const eyeOpen = toggleBtn.querySelector('.eye-open');
      const eyeClosed = toggleBtn.querySelector('.eye-closed');

      if (input.type === 'password') {
        input.type = 'text';
        if (eyeOpen) eyeOpen.classList.add('hidden');
        if (eyeClosed) eyeClosed.classList.remove('hidden');
      } else {
        input.type = 'password';
        if (eyeOpen) eyeOpen.classList.remove('hidden');
        if (eyeClosed) eyeClosed.classList.add('hidden');
      }
    });
  });

  function toggleAllPasswords() {
    let newState = 'text';
    const firstPass = document.getElementById('signinPassword');
    if (firstPass && firstPass.type === 'text') newState = 'password';

    document.querySelectorAll('input[type="password"], input[data-pass="true"]').forEach(input => {
      input.type = newState;
      if (newState === 'text') input.setAttribute('data-pass', 'true');
    });
    showToast('Password Visibility', `Passwords are now ${newState === 'text' ? 'visible' : 'hidden'}.`, 'info');
  }

  function calculatePasswordStrength(pass) {
    if (!pass) return { score: 0, text: 'Password strength' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    const strengthMap = {
      0: 'Very weak',
      1: 'Weak (add numbers/symbols)',
      2: 'Fair (add special chars)',
      3: 'Good strength',
      4: 'Excellent & secure'
    };
    return { score, text: strengthMap[score] };
  }

  if (signupPassword) {
    signupPassword.addEventListener('input', () => {
      const val = signupPassword.value;
      const { score, text } = calculatePasswordStrength(val);
      if (val.length === 0) {
        passwordMeter.removeAttribute('data-score');
        meterText.textContent = 'Password strength';
        meterText.style.color = 'var(--text-dim)';
      } else {
        passwordMeter.setAttribute('data-score', score);
        meterText.textContent = text;
        const colors = { 1: '#ef4444', 2: '#f59e0b', 3: '#38bdf8', 4: '#10b981' };
        meterText.style.color = colors[score] || 'var(--text-dim)';
      }
    });
  }

  function setFieldError(fieldId, errorMsg) {
    const inputElement = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}Error`);
    if (inputElement && inputElement.closest('.input-wrapper')) {
      inputElement.closest('.input-wrapper').classList.add('error');
    }
    if (errorElement) errorElement.textContent = errorMsg;
  }

  function clearFieldError(fieldId) {
    const inputElement = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}Error`);
    if (inputElement && inputElement.closest('.input-wrapper')) {
      inputElement.closest('.input-wrapper').classList.remove('error');
    }
    if (errorElement) errorElement.textContent = '';
  }

  function clearErrors() {
    document.querySelectorAll('.input-wrapper').forEach(w => w.classList.remove('error'));
    document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
  }

  [signinEmail, signinPassword, signupName, signupEmail, signupPassword, signupCustomDomain].forEach(input => {
    if (input) input.addEventListener('input', () => clearFieldError(input.id));
  });

  function setButtonLoading(btn, isLoading) {
    if (!btn) return;
    const textSpan = btn.querySelector('.btn-text');
    const spinnerSpan = btn.querySelector('.btn-spinner');
    const iconSpan = btn.querySelector('.btn-icon');

    if (isLoading) {
      btn.disabled = true;
      btn.style.opacity = '0.85';
      if (spinnerSpan) spinnerSpan.classList.remove('hidden');
      if (iconSpan) iconSpan.classList.add('hidden');
    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
      if (spinnerSpan) spinnerSpan.classList.add('hidden');
      if (iconSpan) iconSpan.classList.remove('hidden');
    }
  }

  function applyDemoCredentials() {
    switchView('login');
    switchAuthTab('signin');
    if (signinEmail) signinEmail.value = 'alex.developer@hackathon.dev';
    if (signinPassword) signinPassword.value = 'Hackathon#2026';
    clearErrors();
    if (noAccountNotice) noAccountNotice.classList.add('hidden');
    showToast('Demo Credentials Applied', 'Pre-filled: alex.developer@hackathon.dev', 'info');
  }

  if (demoAutoFillBtn) demoAutoFillBtn.addEventListener('click', applyDemoCredentials);

  // Sign In Submission - strictly allows users ONLY when they already have an account!
  if (signInForm) {
    signInForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();
      if (noAccountNotice) noAccountNotice.classList.add('hidden');

      const email = signinEmail.value.trim();
      const password = signinPassword.value.trim();
      let hasError = false;

      if (!email) {
        setFieldError('signinEmail', 'Please enter your email address');
        hasError = true;
      } else if (!emailRegex.test(email)) {
        setFieldError('signinEmail', 'Enter a valid email address');
        hasError = true;
      }
      if (!password) {
        setFieldError('signinPassword', 'Please enter your password');
        hasError = true;
      }

      if (hasError) return;

      setButtonLoading(signinSubmitBtn, true);

      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json().catch(() => ({}));
        setButtonLoading(signinSubmitBtn, false);

        // Case 1: Account NOT FOUND - Tell user they must create an account
        if (res.status === 404 || data.code === 'ACCOUNT_NOT_FOUND' || data.need_register) {
          if (noAccountNotice) {
            noAccountNotice.classList.remove('hidden');
            if (noAccountNoticeMsg) {
              noAccountNoticeMsg.textContent = data.error || `No account found for "${email}". Please create an account to get started.`;
            }
          }
          setFieldError('signinEmail', 'Account does not exist. Please create an account below.');
          if (signupEmail) signupEmail.value = email;
          showToast('Account Not Found', `No registered account found for "${email}". Please create an account and pick your domain.`, 'error');
          return; // DO NOT log in!
        }

        // Case 2: Incorrect Password credentials
        if (res.status === 401 || data.code === 'INVALID_CREDENTIALS') {
          setFieldError('signinPassword', data.error || 'Incorrect password. Please verify your credentials.');
          showToast('Authentication Failed', 'Incorrect password. Please check your credentials.', 'error');
          return; // DO NOT log in!
        }

        // Case 3: Other unexpected failure
        if (!res.ok || (!data.success && !data.token)) {
          const errMsg = data.error || data.detail || 'Sign in failed. Please verify credentials.';
          setFieldError('signinPassword', errMsg);
          showToast('Sign In Error', errMsg, 'error');
          return; // DO NOT log in!
        }

        // Case 4: Verified account exists! Log in user
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        state.user.email = (data.user && data.user.email) || email;
        state.user.name = (data.user && data.user.name) || email.split('@')[0];
        syncUserToUI();
        showToast('Access Granted!', `Welcome back, ${state.user.name}!`, 'success');

        // Select and load domain assigned to user profile
        const domainToSelect = data.selected_domain || state.selectedDomain || 'ai-agents';
        await selectDomain(domainToSelect, false);

        setTimeout(() => switchView('profile'), 400);
      } catch (err) {
        setButtonLoading(signinSubmitBtn, false);
        console.error('Sign in network error:', err);
        showToast('Connection Error', 'Could not reach authentication server. Please ensure backend is running.', 'error');
      }
    });
  }

  // Sign Up Submission - asks for interested domain track and provisions profile
  if (signUpForm) {
    signUpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();
      const name = signupName.value.trim();
      const email = signupEmail.value.trim();
      const password = signupPassword.value.trim();
      let hasError = false;

      if (!name) {
        setFieldError('signupName', 'Full name is required');
        hasError = true;
      }
      if (!email || !emailRegex.test(email)) {
        setFieldError('signupEmail', 'Valid email is required');
        hasError = true;
      }
      if (!password || password.length < 8) {
        setFieldError('signupPassword', 'Password must be at least 8 characters');
        hasError = true;
      }

      // Check chosen domain
      let chosenDomain = signupDomain ? signupDomain.value : 'ai-agents';
      if (chosenDomain === 'other') {
        const customVal = signupCustomDomain ? signupCustomDomain.value.trim() : '';
        if (!customVal) {
          setFieldError('signupDomain', 'Please specify your custom interested domain');
          hasError = true;
        } else {
          chosenDomain = customVal;
        }
      }

      if (termsAgree && !termsAgree.checked) {
        const termsErr = document.getElementById('signupTermsError');
        if (termsErr) termsErr.textContent = 'You must accept terms & privacy policy';
        hasError = true;
      }

      if (hasError) return;

      setButtonLoading(signupSubmitBtn, true);

      try {
        const res = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            password,
            interested_domain: chosenDomain
          })
        });

        const data = await res.json().catch(() => ({}));
        setButtonLoading(signupSubmitBtn, false);

        if (res.status === 409 || data.code === 'ACCOUNT_EXISTS') {
          setFieldError('signupEmail', data.error || 'An account with this email already exists. Please sign in instead.');
          showToast('Account Exists', `An account with "${email}" already exists. Please switch to Sign In.`, 'warning');
          return;
        }

        if (!res.ok || (!data.success && !data.token)) {
          const errMsg = data.error || data.detail || 'Registration failed. Please check your inputs.';
          showToast('Registration Error', errMsg, 'error');
          return;
        }

        // Registration successful!
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        state.user.name = (data.user && data.user.name) || name;
        state.user.email = (data.user && data.user.email) || email;
        syncUserToUI();

        const domainToActivate = data.selected_domain || chosenDomain || 'ai-agents';
        await selectDomain(domainToActivate, false);

        showToast('Account Created!', `Welcome to CareerVista Platform, ${state.user.name}! Interested domain set.`, 'success');
        setTimeout(() => switchView('profile'), 400);
      } catch (err) {
        setButtonLoading(signupSubmitBtn, false);
        console.error('Registration network error:', err);
        showToast('Connection Error', 'Could not reach authentication server. Please check backend connection.', 'error');
      }
    });
  }

  function performSocialLogin(provider) {
    showToast('Connecting', `Authorizing connection with ${provider}...`, 'info');
    setTimeout(() => {
      showToast('Authenticated', `Session authorized via ${provider}!`, 'success');
      state.user.name = `Alex (${provider} User)`;
      syncUserToUI();
      switchView('profile');
    }, 600);
  }

  const googleAuthBtn = document.getElementById('googleAuthBtn');
  const githubAuthBtn = document.getElementById('githubAuthBtn');
  const appleAuthBtn = document.getElementById('appleAuthBtn');

  if (googleAuthBtn) googleAuthBtn.addEventListener('click', () => performSocialLogin('Google'));
  if (githubAuthBtn) githubAuthBtn.addEventListener('click', () => performSocialLogin('GitHub'));
  if (appleAuthBtn) appleAuthBtn.addEventListener('click', () => performSocialLogin('Apple'));

  function handleLogout() {
    switchView('login');
    if (signinPassword) signinPassword.value = '';
    showToast('Signed Out', 'You have been disconnected safely from the portal.', 'info');
  }

  if (menuLogoutBtn) menuLogoutBtn.addEventListener('click', handleLogout);

  // =========================================================================
  // 7. Profile & Workspace Sync
  // =========================================================================
  function getInitials(name) {
    if (!name) return 'NX';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function syncUserToUI() {
    const initials = getInitials(state.user.name);
    if (menuAvatarInitials) menuAvatarInitials.textContent = initials;
    if (menuProfileName) menuProfileName.textContent = state.user.name;

    const dashProfileName = document.getElementById('dashProfileName');
    const dashProfileEmail = document.getElementById('dashProfileEmail');
    const dashProfileBio = document.getElementById('dashProfileBio');
    const dashAvatarText = document.getElementById('dashAvatarText');
    const profileEducation = document.getElementById('profileEducation');
    const roadmapRoleBadge = document.getElementById('roadmapRoleBadge');

    if (dashProfileName) dashProfileName.textContent = state.user.name;
    if (dashProfileEmail) dashProfileEmail.textContent = state.user.email;
    if (dashProfileBio) dashProfileBio.textContent = state.user.bio;
    if (dashAvatarText) dashAvatarText.textContent = initials;
    if (roadmapRoleBadge) roadmapRoleBadge.textContent = state.user.targetRole;
    if (profileEducation) profileEducation.textContent = state.user.education.split(',')[0];

    const skillsCloud = document.getElementById('skillsTagCloud');
    if (skillsCloud) {
      skillsCloud.innerHTML = state.user.skills.map(s => `<span class="skill-pill">${s}</span>`).join('');
    }
  }

  // Edit Profile Form
  const editProfileBtn = document.getElementById('editProfileBtn');
  const closeEditProfileModal = document.getElementById('closeEditProfileModal');
  const editProfileForm = document.getElementById('editProfileForm');

  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      document.getElementById('editFullName').value = state.user.name;
      document.getElementById('editTargetRole').value = state.user.targetRole;
      document.getElementById('editEducation').value = state.user.education;
      document.getElementById('editBio').value = state.user.bio;
      document.getElementById('editSkillsInput').value = state.user.skills.join(', ');
      document.getElementById('editInterestsInput').value = state.user.interests.join(', ');
      openModal(editProfileModal);
    });
  }

  if (closeEditProfileModal) closeEditProfileModal.addEventListener('click', () => closeModal(editProfileModal));

  if (editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      state.user.name = document.getElementById('editFullName').value.trim();
      state.user.targetRole = document.getElementById('editTargetRole').value;
      state.user.education = document.getElementById('editEducation').value.trim();
      state.user.bio = document.getElementById('editBio').value.trim();

      const rawSkills = document.getElementById('editSkillsInput').value;
      state.user.skills = rawSkills.split(',').map(s => s.trim()).filter(Boolean);

      const rawInterests = document.getElementById('editInterestsInput').value;
      state.user.interests = rawInterests.split(',').map(i => i.trim()).filter(Boolean);

      syncUserToUI();
      closeModal(editProfileModal);
      showToast('Profile Updated', 'Profile attributes saved to database!', 'success');

      try {
        await fetch('/api/v1/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: state.user.name,
            target_role: state.user.targetRole,
            education: state.user.education,
            skills: state.user.skills,
            interests: state.user.interests,
            bio: state.user.bio
          })
        });
      } catch (err) {}
    });
  }


  // =========================================================================
  // 10. AI Tutor & Career Mentor Chatbot Engine (Powered by Gemini AI + Voice)
  // =========================================================================
  const aiTutorPanel = document.getElementById('aiTutorPanel');
  const aiTutorAvatarBadge = document.getElementById('aiTutorAvatarBadge');
  const aiVoiceToggleBtn = document.getElementById('aiVoiceToggleBtn');
  const aiStopSpeechBtn = document.getElementById('aiStopSpeechBtn');
  const aiClearChatBtn = document.getElementById('aiClearChatBtn');
  const aiSpeakingBanner = document.getElementById('aiSpeakingBanner');
  const stopSpeakingChipBtn = document.getElementById('stopSpeakingChipBtn');
  const aiTutorDomainTag = document.getElementById('aiTutorDomainTag');
  const aiChatMessages = document.getElementById('aiChatMessages');
  const aiTypingIndicator = document.getElementById('aiTypingIndicator');
  const voiceListeningCard = document.getElementById('voiceListeningCard');
  const voiceTranscriptPreview = document.getElementById('voiceTranscriptPreview');
  const stopMicBtn = document.getElementById('stopMicBtn');
  const aiChatInputForm = document.getElementById('aiChatInputForm');
  const aiChatInput = document.getElementById('aiChatInput');
  const aiMicBtn = document.getElementById('aiMicBtn');
  const aiSendBtn = document.getElementById('aiSendBtn');

  let isVoiceModeActive = true;
  let isListening = false;
  let aiConversationHistory = [];
  let currentSpeechUtterance = null;

  // Toggle Voice Output (AI talking out loud)
  if (aiVoiceToggleBtn) {
    aiVoiceToggleBtn.addEventListener('click', () => {
      isVoiceModeActive = !isVoiceModeActive;
      if (isVoiceModeActive) {
        aiVoiceToggleBtn.classList.add('active');
        aiVoiceToggleBtn.innerHTML = '<span class="voice-icon">🔊</span><span class="voice-text">Voice: ON</span>';
        showToast('Voice Output Enabled', 'AI Tutor will speak answers aloud using voice synthesis.', 'info');
      } else {
        aiVoiceToggleBtn.classList.remove('active');
        aiVoiceToggleBtn.innerHTML = '<span class="voice-icon">🔇</span><span class="voice-text">Voice: OFF</span>';
        stopAiSpeech();
        showToast('Voice Output Muted', 'AI Tutor answers will be displayed in text only.', 'info');
      }
    });
  }

  // Stop Speech controls
  if (aiStopSpeechBtn) aiStopSpeechBtn.addEventListener('click', stopAiSpeech);
  if (stopSpeakingChipBtn) stopSpeakingChipBtn.addEventListener('click', stopAiSpeech);

  // Clear Chat history
  if (aiClearChatBtn) {
    aiClearChatBtn.addEventListener('click', () => {
      stopAiSpeech();
      aiConversationHistory = [];
      if (aiChatMessages) {
        aiChatMessages.innerHTML = `
          <div class="chat-message bot-message">
            <div class="message-avatar">🤖</div>
            <div class="message-bubble">
              <div class="message-sender-row">
                <strong class="sender-name">Gemini AI Tutor</strong>
                <span class="message-time">Just now</span>
                <button type="button" class="msg-speak-btn" title="Read Aloud" data-text="Chat cleared! What technical topic or question would you like to explore next?">🔊</button>
              </div>
              <div class="message-content">
                <p>Chat cleared! What technical topic, architecture pattern, or assessment question would you like to explore next? Tap 🎙️ or type below.</p>
              </div>
            </div>
          </div>
        `;
        wireSpeakButtons();
      }
      showToast('Chat Cleared', 'AI Tutor conversation history reset.', 'info');
    });
  }

  // Context Prompt Chips
  document.querySelectorAll('.context-prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt) submitAiChatMessage(prompt);
    });
  });

  // Speech-to-Text via Web Speech Recognition (Microphone)
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let speechRecognizer = null;

  if (SpeechRec) {
    try {
      speechRecognizer = new SpeechRec();
      speechRecognizer.continuous = false;
      speechRecognizer.interimResults = true;
      speechRecognizer.lang = 'en-US';

      speechRecognizer.onstart = () => {
        isListening = true;
        if (aiMicBtn) aiMicBtn.classList.add('listening');
        if (voiceListeningCard) voiceListeningCard.classList.remove('hidden');
        if (voiceTranscriptPreview) voiceTranscriptPreview.textContent = 'Listening... Speak your question now';
        stopAiSpeech(); // Stop AI speaking so mic doesn't hear bot
      };

      speechRecognizer.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const spokenWords = finalTranscript || interimTranscript;
        if (voiceTranscriptPreview && spokenWords) {
          voiceTranscriptPreview.textContent = `"${spokenWords}"`;
        }
        if (aiChatInput && spokenWords) {
          aiChatInput.value = spokenWords;
        }
      };

      speechRecognizer.onerror = (event) => {
        console.warn('Speech Recognition notice:', event.error);
        stopListeningState();
        if (event.error !== 'no-speech') {
          showToast('Microphone', `Speech recognition error: ${event.error}`, 'warning');
        }
      };

      speechRecognizer.onend = () => {
        const textToSubmit = aiChatInput ? aiChatInput.value.trim() : '';
        stopListeningState();
        // Automatically submit voice query once user finishes speaking!
        if (textToSubmit) {
          submitAiChatMessage(textToSubmit);
        }
      };
    } catch (e) {
      console.warn('SpeechRecognition initialization error:', e);
    }
  }

  function startListening() {
    if (!SpeechRec || !speechRecognizer) {
      showToast('Microphone Notice', 'Speech-to-Text is supported in Chrome, Edge, and Safari browsers. You can type directly below.', 'info');
      return;
    }
    stopAiSpeech();
    try {
      speechRecognizer.start();
    } catch (err) {
      try {
        speechRecognizer.stop();
        setTimeout(() => speechRecognizer.start(), 200);
      } catch (e) {}
    }
  }

  function stopListeningState() {
    isListening = false;
    if (aiMicBtn) aiMicBtn.classList.remove('listening');
    if (voiceListeningCard) voiceListeningCard.classList.add('hidden');
    if (speechRecognizer) {
      try { speechRecognizer.stop(); } catch (e) {}
    }
  }

  if (aiMicBtn) {
    aiMicBtn.addEventListener('click', () => {
      if (isListening) {
        stopListeningState();
      } else {
        startListening();
      }
    });
  }

  if (stopMicBtn) {
    stopMicBtn.addEventListener('click', () => {
      const textToSubmit = aiChatInput ? aiChatInput.value.trim() : '';
      stopListeningState();
      if (textToSubmit) submitAiChatMessage(textToSubmit);
    });
  }

  // Text-to-Speech (Bot talks with user)
  function speakAiResponse(textToSpeak) {
    if (!isVoiceModeActive || !('speechSynthesis' in window)) return;

    stopAiSpeech();

    const cleanSpeech = textToSpeak
      .replace(/```[\s\S]*?```/g, ' Code example displayed in chat. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_#~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/•|\*|- /g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .replace(/\.\.+/g, '.')
      .trim();

    if (!cleanSpeech) return;

    currentSpeechUtterance = new SpeechSynthesisUtterance(cleanSpeech);
    currentSpeechUtterance.rate = 1.0;
    currentSpeechUtterance.pitch = 1.0;

    // Pick natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Jenny') || v.name.includes('David')));
    if (naturalVoice) currentSpeechUtterance.voice = naturalVoice;

    currentSpeechUtterance.onstart = () => {
      if (aiSpeakingBanner) aiSpeakingBanner.classList.remove('hidden');
      if (aiStopSpeechBtn) aiStopSpeechBtn.classList.remove('hidden');
      if (aiTutorAvatarBadge) aiTutorAvatarBadge.classList.add('talking');
    };

    currentSpeechUtterance.onend = () => {
      stopSpeechVisuals();
    };

    currentSpeechUtterance.onerror = () => {
      stopSpeechVisuals();
    };

    window.speechSynthesis.speak(currentSpeechUtterance);
  }

  function stopAiSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    stopSpeechVisuals();
  }

  function stopSpeechVisuals() {
    if (aiSpeakingBanner) aiSpeakingBanner.classList.add('hidden');
    if (aiStopSpeechBtn) aiStopSpeechBtn.classList.add('hidden');
    if (aiTutorAvatarBadge) aiTutorAvatarBadge.classList.remove('talking');
  }

  // Helper: Format markdown to safe HTML for chatbot messages
  function formatMarkdown(text) {
    if (!text) return '';
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks
    escaped = escaped.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    });

    // Inline code
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Headings
    escaped = escaped.replace(/^### (.*$)/gim, '<h4 style="color:#38bdf8;margin:0.4rem 0 0.2rem;">$1</h4>');
    escaped = escaped.replace(/^## (.*$)/gim, '<h3 style="color:#ffffff;margin:0.5rem 0 0.3rem;">$1</h3>');

    // Bullet items
    escaped = escaped.replace(/^\* (.*$)/gim, '<li>$1</li>');
    escaped = escaped.replace(/^- (.*$)/gim, '<li>$1</li>');
    escaped = escaped.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');

    // Paragraphs
    const paragraphs = escaped.split(/\n\n+/).map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<pre>') || p.startsWith('<ul>') || p.startsWith('<h')) return p;
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return paragraphs || escaped;
  }

  function scrollChatToBottom() {
    if (aiChatMessages) {
      aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    }
  }

  function appendUserMessage(text) {
    if (!aiChatMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message user-message';
    msgDiv.innerHTML = `
      <div class="message-avatar">👤</div>
      <div class="message-bubble">
        <div class="message-sender-row">
          <strong class="sender-name">${state.user.name || 'You'}</strong>
          <span class="message-time">Just now</span>
        </div>
        <div class="message-content">
          <p>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
      </div>
    `;
    aiChatMessages.appendChild(msgDiv);
    scrollChatToBottom();
  }

  function appendBotMessage(replyMarkdown, audioText, source = 'gemini_ai', model = '') {
    if (!aiChatMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message bot-message';
    const formattedHtml = formatMarkdown(replyMarkdown);
    const escapedAudio = (audioText || replyMarkdown).replace(/"/g, '&quot;');
    const isLiveGemini = source === 'gemini_ai';
    const sourceBadge = isLiveGemini
      ? `<span class="ai-source-pill live-gemini" title="Generated by Google Gemini (${model || 'gemini-2.0-flash'})">✨ Gemini AI</span>`
      : `<span class="ai-source-pill knowledge-base" title="CareerVista Technical Knowledge Engine">🤖 Career Mentor</span>`;

    msgDiv.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-bubble">
        <div class="message-sender-row">
          <strong class="sender-name">Gemini AI Tutor</strong>
          ${sourceBadge}
          <span class="message-time">Just now</span>
          <button type="button" class="msg-speak-btn" title="Read Aloud" data-text="${escapedAudio}">🔊</button>
        </div>
        <div class="message-content">
          ${formattedHtml}
        </div>
      </div>
    `;
    aiChatMessages.appendChild(msgDiv);
    scrollChatToBottom();
    wireSpeakButtons();
  }

  function wireSpeakButtons() {
    document.querySelectorAll('.msg-speak-btn').forEach(btn => {
      btn.onclick = () => {
        const textToRead = btn.getAttribute('data-text');
        if (textToRead) speakAiResponse(textToRead);
      };
    });
  }
  wireSpeakButtons();

  // Submit AI Chat Message to backend Gemini API
  async function submitAiChatMessage(messageText) {
    const cleanMsg = (messageText || (aiChatInput ? aiChatInput.value : '')).trim();
    if (!cleanMsg) return;

    if (aiChatInput) {
      aiChatInput.value = '';
      aiChatInput.style.height = 'auto';
    }

    appendUserMessage(cleanMsg);

    if (aiTypingIndicator) aiTypingIndicator.classList.remove('hidden');
    scrollChatToBottom();

    try {
      const res = await fetch('/api/v1/ai-tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': state.geminiApiKey || ''
        },
        body: JSON.stringify({
          message: cleanMsg,
          domain: state.selectedDomain || 'ai-agents',
          history: aiConversationHistory.slice(-6),
          gemini_api_key: state.geminiApiKey || '',
          user_context: {
            name: state.user.name,
            education: state.user.education,
            skills: state.user.skills,
            targetRole: state.user.targetRole
          }
        })
      });

      const data = await res.json().catch(() => ({}));
      if (aiTypingIndicator) aiTypingIndicator.classList.add('hidden');

      if (res.ok && data.success) {
        appendBotMessage(data.reply, data.audio_text, data.source, data.model);
        aiConversationHistory.push({ role: 'user', content: cleanMsg });
        aiConversationHistory.push({ role: 'model', content: data.reply });

        // Speak answer out loud if voice mode is enabled!
        if (isVoiceModeActive) {
          speakAiResponse(data.audio_text || data.reply);
        }
      } else {
        const errMsg = data.error || 'Sorry, I encountered an issue processing your question. Please try again.';
        appendBotMessage(errMsg, errMsg, 'error');
      }
    } catch (err) {
      if (aiTypingIndicator) aiTypingIndicator.classList.add('hidden');
      const fallbackMsg = "I'm having trouble connecting right now. Please verify your backend server is running.";
      appendBotMessage(fallbackMsg, fallbackMsg, 'error');
    }

    scrollChatToBottom();
  }

  // Gemini API Key Management Modal
  function initGeminiKeyModal() {
    state.geminiApiKey = localStorage.getItem('careervista_gemini_api_key') || '';

    const keyModal = document.getElementById('geminiKeyModal');
    const keyConfigBtn = document.getElementById('aiKeyConfigBtn');
    const closeKeyModal = document.getElementById('closeGeminiKeyModal');
    const keyForm = document.getElementById('geminiKeyForm');
    const keyInput = document.getElementById('geminiApiKeyInput');
    const toggleVisBtn = document.getElementById('toggleGeminiKeyVis');
    const removeKeyBtn = document.getElementById('removeGeminiKeyBtn');
    const statusText = document.getElementById('aiKeyStatusText');

    function updateKeyButtonUI() {
      if (!keyConfigBtn || !statusText) return;
      if (state.geminiApiKey) {
        keyConfigBtn.classList.add('connected');
        statusText.textContent = 'Gemini: Active';
        keyConfigBtn.title = 'Gemini API Key active (Click to manage)';
      } else {
        keyConfigBtn.classList.remove('connected');
        statusText.textContent = 'Gemini Key';
        keyConfigBtn.title = 'Configure Google Gemini API Key';
      }
    }

    updateKeyButtonUI();

    if (keyConfigBtn) {
      keyConfigBtn.addEventListener('click', () => {
        if (keyInput) keyInput.value = state.geminiApiKey || '';
        openModal(keyModal);
      });
    }

    if (closeKeyModal) {
      closeKeyModal.addEventListener('click', () => closeModal(keyModal));
    }

    if (toggleVisBtn && keyInput) {
      toggleVisBtn.addEventListener('click', () => {
        keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
      });
    }

    if (keyForm) {
      keyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const entered = (keyInput ? keyInput.value : '').trim();
        if (!entered) {
          showToast('Key Required', 'Please enter a valid Gemini API key.', 'warning');
          return;
        }

        const saveBtn = document.getElementById('saveGeminiKeyBtn');
        const origBtnText = saveBtn ? saveBtn.innerHTML : '';
        if (saveBtn) {
          saveBtn.innerHTML = '<span>Verifying Key...</span>';
          saveBtn.disabled = true;
        }

        try {
          const res = await fetch('/api/v1/ai-tutor/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: entered })
          });
          const data = await res.json().catch(() => ({}));

          if (saveBtn) {
            saveBtn.innerHTML = origBtnText;
            saveBtn.disabled = false;
          }

          if (res.ok && data.success) {
            state.geminiApiKey = entered;
            localStorage.setItem('careervista_gemini_api_key', entered);
            updateKeyButtonUI();
            closeModal(keyModal);
            showToast('Gemini Connected!', 'AI Tutor is now querying live Google Gemini in the backend.', 'success');
          } else {
            showToast('Invalid Key', data.error || 'Google Gemini rejected this key.', 'error');
          }
        } catch (err) {
          if (saveBtn) {
            saveBtn.innerHTML = origBtnText;
            saveBtn.disabled = false;
          }
          state.geminiApiKey = entered;
          localStorage.setItem('careervista_gemini_api_key', entered);
          updateKeyButtonUI();
          closeModal(keyModal);
          showToast('Key Saved Locally', 'Key saved in browser and will be used for Gemini requests.', 'info');
        }
      });
    }

    if (removeKeyBtn) {
      removeKeyBtn.addEventListener('click', async () => {
        state.geminiApiKey = '';
        localStorage.removeItem('careervista_gemini_api_key');
        if (keyInput) keyInput.value = '';
        updateKeyButtonUI();
        await fetch('/api/v1/ai-tutor/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: '' })
        }).catch(() => {});
        closeModal(keyModal);
        showToast('Key Removed', 'AI Tutor will use CareerVista technical knowledge base.', 'info');
      });
    }
  }

  // Handle form submission and keyboard shortcuts
  if (aiChatInputForm) {
    aiChatInputForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitAiChatMessage();
    });
  }

  if (aiChatInput) {
    aiChatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitAiChatMessage();
      }
    });

    // Auto-expand textarea
    aiChatInput.addEventListener('input', () => {
      aiChatInput.style.height = 'auto';
      aiChatInput.style.height = Math.min(aiChatInput.scrollHeight, 100) + 'px';
    });
  }

  // New Submission Modal
  const newSubmissionBtn = document.getElementById('newSubmissionBtn');
  const closeSubmitProjectModal = document.getElementById('closeSubmitProjectModal');
  const newProjectForm = document.getElementById('newProjectForm');

  if (newSubmissionBtn) {
    newSubmissionBtn.addEventListener('click', () => openModal(submitProjectModal));
  }
  if (closeSubmitProjectModal) {
    closeSubmitProjectModal.addEventListener('click', () => closeModal(submitProjectModal));
  }

  if (newProjectForm) {
    newProjectForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('projName').value.trim();
      const desc = document.getElementById('projDesc').value.trim();
      const tags = document.getElementById('projTags').value.split(',').map(t => t.trim()).filter(Boolean);

      state.projects.unshift({
        id: state.projects.length + 1,
        name,
        status: 'In Review',
        statusClass: 'in-progress',
        desc,
        tags,
        progress: 35
      });

      renderProjects();
      closeModal(submitProjectModal);
      newProjectForm.reset();
      showToast('Project Submitted', `Prototype "${name}" registered!`, 'success');
    });
  }

  function renderProjects() {
    const list = document.getElementById('projectsList');
    if (!list) return;
    list.innerHTML = state.projects.map(p => `
      <div class="project-item">
        <div class="project-info">
          <div class="project-title-row">
            <h4 class="project-name">${p.name}</h4>
            <span class="status-pill ${p.statusClass}">${p.status}</span>
          </div>
          <p class="project-desc">${p.desc}</p>
          <div class="project-tags">
            ${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
        </div>
        <div class="project-progress-wrap">
          <div class="progress-bar-bg"><div class="progress-bar-fill ${p.progress === 100 ? 'completed' : ''}" style="width: ${p.progress}%;"></div></div>
          <span class="progress-text">${p.progress}% ${p.progress === 100 ? 'Ready' : 'Complete'}</span>
        </div>
      </div>
    `).join('');
  }

  // =========================================================================
  // 8. Roadmap Module & Milestone Toggles
  // =========================================================================
  function renderRoadmap() {
    const list = document.getElementById('roadmapStepsList');
    if (!list) return;

    list.innerHTML = state.roadmapSteps.map((step, idx) => {
      const statusLabels = {
        'completed': 'Completed ✓',
        'in-progress': 'In Progress ⏳',
        'pending': 'Pending'
      };
      return `
        <div class="roadmap-step ${step.status}" data-step-id="${step.id}">
          <div class="step-sidebar">
            <div class="step-number">${idx + 1}</div>
            <div class="step-connector"></div>
          </div>
          <div class="step-body">
            <div class="step-header">
              <h4 class="step-title">${step.title}</h4>
              <button type="button" class="step-status-btn status-${step.status}" data-step="${step.id}" title="Click to advance status">
                ${statusLabels[step.status]}
              </button>
            </div>
            <p class="step-desc">${step.desc}</p>
            <div class="step-meta">
              <span class="meta-tag">Domain: ${step.domain}</span>
              <a href="${step.url}" target="_blank" rel="noopener noreferrer" class="resource-link">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                <span>${step.urlLabel}</span>
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.step-status-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const stepId = parseInt(btn.getAttribute('data-step'), 10);
        toggleStepStatus(stepId);
      });
    });

    updateRoadmapProgress();
  }

  function toggleStepStatus(stepId) {
    const step = state.roadmapSteps.find(s => s.id === stepId);
    if (!step) return;

    const nextStatus = {
      'pending': 'in-progress',
      'in-progress': 'completed',
      'completed': 'pending'
    };
    step.status = nextStatus[step.status] || 'pending';
    renderRoadmap();
    showToast('Milestone Updated', `"${step.title.slice(0, 30)}..." is now ${step.status}.`, 'info');

    try {
      fetch(`/api/v1/roadmap/step/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: step.status })
      });
    } catch (e) {}
  }

  function updateRoadmapProgress() {
    const completed = state.roadmapSteps.filter(s => s.status === 'completed').length;
    const total = state.roadmapSteps.length;
    const pct = Math.round((completed / total) * 100);

    const completedEl = document.getElementById('roadmapCompletedCount');
    const totalEl = document.getElementById('roadmapTotalCount');
    const percentEl = document.getElementById('roadmapPercent');
    const fillEl = document.getElementById('roadmapProgressFill');

    if (completedEl) completedEl.textContent = completed;
    if (totalEl) totalEl.textContent = total;
    if (percentEl) percentEl.textContent = `${pct}%`;
    if (fillEl) fillEl.style.width = `${pct}%`;
  }

  async function loadRoadmapForActiveDomain(requestedDomain) {
    const domainId = requestedDomain || state.selectedDomain || 'ai-agents';
    try {
      const res = await fetch(`/api/v1/roadmap?domain=${encodeURIComponent(domainId)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.steps && Array.isArray(data.steps) && data.steps.length > 0) {
        state.roadmapSteps = data.steps.map((s, idx) => ({
          id: s.id || (idx + 1),
          title: s.title,
          desc: s.desc || s.title,
          domain: data.domain_name || s.domain,
          url: s.resource_url || 'https://careervista.dev/resources',
          urlLabel: s.urlLabel || `${data.domain_name || 'Milestone'} Guide`,
          status: s.status || (idx === 0 ? 'completed' : idx === 1 ? 'in-progress' : 'pending')
        }));
        const roadmapRoleBadge = document.getElementById('roadmapRoleBadge');
        if (roadmapRoleBadge && data.target_role) {
          roadmapRoleBadge.textContent = data.target_role;
        }
        const roadmapDomainBadge = document.getElementById('roadmapDomainBadge');
        if (roadmapDomainBadge) {
          roadmapDomainBadge.textContent = `${data.domain_icon || '🎯'} ${data.domain_name || domainId}`;
        }
        renderRoadmap();
      }
    } catch (err) {
      console.warn('Failed to load domain roadmap:', err);
    }
  }

  async function regenerateRoadmap() {
    await loadRoadmapForActiveDomain(state.selectedDomain || 'ai-agents');
    const domainName = state.domainData?.domain?.name || 'Selected Track';
    showToast('Roadmap Synced', `Roadmap refreshed exclusively for ${domainName}.`, 'success');
  }

  const regenRoadmapBtn = document.getElementById('regenRoadmapBtn');
  if (regenRoadmapBtn) {
    regenRoadmapBtn.addEventListener('click', () => {
      regenerateRoadmap();
    });
  }

  const exportRoadmapBtn = document.getElementById('exportRoadmapBtn');
  if (exportRoadmapBtn) {
    exportRoadmapBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('https://careervista.dev/roadmap/shared/alex-morgan-2026').catch(() => {});
      showToast('Share Link Ready', 'Shareable career progression URL copied to clipboard!', 'success');
    });
  }

  // =========================================================================
  // 9. Generic Modal Utilities
  // =========================================================================
  function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
  }

  const openForgotModalBtn = document.getElementById('openForgotModal');
  const closeForgotModalBtn = document.getElementById('closeForgotModal');
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  const forgotEmail = document.getElementById('forgotEmail');
  const forgotSubmitBtn = document.getElementById('forgotSubmitBtn');

  if (openForgotModalBtn) openForgotModalBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(forgotModal);
  });
  if (closeForgotModalBtn) closeForgotModalBtn.addEventListener('click', () => closeModal(forgotModal));

  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = forgotEmail.value.trim();
      if (!email || !emailRegex.test(email)) {
        setFieldError('forgotEmail', 'Please enter a valid email address');
        return;
      }
      setButtonLoading(forgotSubmitBtn, true);
      setTimeout(() => {
        setButtonLoading(forgotSubmitBtn, false);
        closeModal(forgotModal);
        showToast('Recovery Link Sent', `Password reset instructions dispatched to ${email}`, 'info');
      }, 700);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [forgotModal, editProfileModal, submitProjectModal, studyArticleModal, certificateModal].forEach(m => closeModal(m));
      if (notifDropdown) notifDropdown.classList.add('hidden');
      if (featuresDropdownWrapper) featuresDropdownWrapper.classList.remove('open');
    }
  });

  [forgotModal, editProfileModal, submitProjectModal, studyArticleModal, certificateModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
  });

  // =========================================================================
  // 10. Initial Boot & Data Hydration
  // =========================================================================
  syncUserToUI();
  renderProjects();
  renderRoadmap();
  initArticleConfirmation();
  initDomainSearch();
  initResumeBuilder();
  initResumeChecker();
  initGeminiKeyModal();

  // Load the initial domain (AI & Autonomous Agents) with its 2 reference articles & 10 questions
  selectDomain('ai-agents', false);
});
