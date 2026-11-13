document.documentElement.classList.add('is-loading');
try {
  const savedTheme = localStorage.getItem('abraham-daud-theme');
  document.documentElement.dataset.theme = savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
} catch {
  document.documentElement.dataset.theme = 'light';
}

function initializePortfolio() {
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.querySelector('#site-nav');
  const themeToggle = document.querySelector('.theme-toggle');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const root = document.documentElement;
  const networkBanner = document.querySelector('#network-banner');
  const networkBannerText = document.querySelector('#network-banner-text');
  const siteStatus = document.querySelector('#site-status');
  const siteStatusText = siteStatus ? siteStatus.querySelector('.status-text') : null;
  const siteStatusDot = siteStatus ? siteStatus.querySelector('.status-indicator') : null;
  const sidebarTab = document.querySelector('#sidebar-tab');
  const sidebarPanel = document.querySelector('#sidebar-panel');
  const sidebarClose = document.querySelector('#sidebar-close');
  const sidebarBackdrop = document.querySelector('#sidebar-backdrop');
  let sidebarBackdropTimer;
  let sidebarIdleTimer;

  function scheduleSidebarHide() {
    if (!sidebarTab || !sidebarPanel || sidebarPanel.classList.contains('is-open')) return;

    window.clearTimeout(sidebarIdleTimer);
    sidebarIdleTimer = window.setTimeout(() => {
      if (!sidebarPanel.classList.contains('is-open') && !sidebarTab.matches(':focus-visible')) {
        sidebarTab.classList.add('is-idle');
      }
    }, 3000);
  }

  function revealSidebarTab() {
    if (!sidebarTab) return;

    sidebarTab.classList.remove('is-idle');
    scheduleSidebarHide();
  }

  function closeSidebar() {
    if (!sidebarPanel || !sidebarTab || !sidebarBackdrop) return;

    sidebarPanel.classList.remove('is-open');
    sidebarPanel.setAttribute('aria-hidden', 'true');
    sidebarPanel.inert = true;
    sidebarTab.setAttribute('aria-expanded', 'false');
    sidebarTab.setAttribute('aria-label', 'Buka navigasi samping');
    sidebarBackdrop.classList.remove('is-visible');
    root.classList.remove('has-sidebar-open');
    sidebarTab.focus({ preventScroll: true });

    window.clearTimeout(sidebarBackdropTimer);
    scheduleSidebarHide();
    sidebarBackdropTimer = window.setTimeout(() => {
      if (!sidebarPanel.classList.contains('is-open')) sidebarBackdrop.hidden = true;
    }, 300);
  }

  if (sidebarTab && sidebarPanel && sidebarClose && sidebarBackdrop) {
    sidebarTab.addEventListener('click', () => {
      window.clearTimeout(sidebarIdleTimer);
      sidebarTab.classList.remove('is-idle');
      window.clearTimeout(sidebarBackdropTimer);
      sidebarBackdrop.hidden = false;
      sidebarPanel.inert = false;
      sidebarPanel.setAttribute('aria-hidden', 'false');
      sidebarTab.setAttribute('aria-expanded', 'true');
      sidebarTab.setAttribute('aria-label', 'Tutup navigasi samping');
      root.classList.add('has-sidebar-open');
      requestAnimationFrame(() => {
        sidebarPanel.classList.add('is-open');
        sidebarBackdrop.classList.add('is-visible');
        sidebarClose.focus({ preventScroll: true });
      });
    });

    sidebarClose.addEventListener('click', closeSidebar);
    sidebarBackdrop.addEventListener('click', closeSidebar);
    sidebarPanel.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeSidebar);
    });

    sidebarPanel.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const focusable = [...sidebarPanel.querySelectorAll('a[href], button:not(:disabled)')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && sidebarPanel.classList.contains('is-open')) {
        closeSidebar();
      }
    });

    document.addEventListener('pointermove', revealSidebarTab, { passive: true });
    document.addEventListener('pointerdown', revealSidebarTab, { passive: true });
    document.addEventListener('touchstart', revealSidebarTab, { passive: true });
    document.addEventListener('keydown', revealSidebarTab);
    document.addEventListener('focusin', revealSidebarTab);
    window.addEventListener('scroll', revealSidebarTab, { capture: true, passive: true });
    window.addEventListener('wheel', revealSidebarTab, { passive: true });
    scheduleSidebarHide();
  }

  const sidebarYear = document.querySelector('#sidebar-year');
  if (sidebarYear) sidebarYear.textContent = new Date().getFullYear();

  function setFeatureLoadingState(selector, isLoading) {
    const target = document.querySelector(selector);
    if (!target) return;

    target.classList.toggle('is-loading', isLoading);
    target.classList.toggle('is-offline', !navigator.onLine);
  }

  function syncConnectionState() {
    const isOnline = navigator.onLine;

    if (siteStatus) {
      siteStatus.classList.toggle('is-offline', !isOnline);
      if (siteStatusText) {
        siteStatusText.textContent = isOnline ? 'Online' : 'Offline';
      }
      if (siteStatusDot) {
        siteStatusDot.setAttribute('title', isOnline ? 'Website online' : 'Website offline');
      }
    }

    if (networkBanner) {
      const shouldShow = !isOnline;
      networkBanner.hidden = !shouldShow;
      networkBanner.classList.toggle('is-visible', shouldShow);
      if (networkBannerText) {
        networkBannerText.textContent = isOnline
          ? 'Koneksi tersedia. Semua fitur telah aktif kembali.'
          : 'Anda sedang offline. Beberapa fitur akan berjalan dalam mode terbatas.';
      }
    }

    ['.hero', '.profile', '.work', '.testimonials', '.contact'].forEach((selector) => {
      const isLoading = !isOnline || document.querySelector(selector)?.classList.contains('is-loading');
      setFeatureLoadingState(selector, isLoading);
    });
  }

  ['.hero', '.profile', '.work', '.testimonials', '.contact'].forEach((selector) => {
    const element = document.querySelector(selector);
    if (!element) return;
    element.classList.add('feature-shell');
  });

  syncConnectionState();
  window.addEventListener('online', syncConnectionState);
  window.addEventListener('offline', syncConnectionState);

  ['.hero', '.profile', '.work', '.testimonials', '.contact'].forEach((selector) => {
    const element = document.querySelector(selector);
    if (!element) return;

    element.classList.add('is-loading');
    window.setTimeout(() => {
      element.classList.remove('is-loading');
      syncConnectionState();
    }, 550);
  });

  function applyTheme(theme, savePreference = false) {
    const isDark = theme === 'dark';
    root.dataset.theme = isDark ? 'dark' : 'light';
    themeToggle.setAttribute('aria-label', isDark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap');
    themeColor.content = isDark ? '#151d19' : '#f5f4ef';

    if (savePreference) {
      try {
        localStorage.setItem('abraham-daud-theme', isDark ? 'dark' : 'light');
      } catch {
        // Tema tetap berlaku sampai halaman ditutup bila penyimpanan tidak tersedia.
      }
    }
  }

  applyTheme(root.dataset.theme || 'light');

  themeToggle.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
  });

  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Buka navigasi' : 'Tutup navigasi');
    siteNav.classList.toggle('is-open', !isOpen);
  });

  siteNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Buka navigasi');
      siteNav.classList.remove('is-open');
    }
  });

  document.querySelector('#year').textContent = new Date().getFullYear();

  const filterButtons = document.querySelectorAll('.filter-button');
  const projectCards = document.querySelectorAll('.project');

  if (filterButtons.length && projectCards.length) {
    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;

        filterButtons.forEach((item) => {
          const isActive = item === button;
          item.classList.toggle('is-active', isActive);
          item.setAttribute('aria-pressed', String(isActive));
        });

        projectCards.forEach((project) => {
          const matches = filter === 'all' || project.dataset.category === filter;
          project.classList.toggle('is-hidden', !matches);
          project.hidden = !matches;
        });
      });
    });
  }

  const heroSlides = [...document.querySelectorAll('.hero-slide')];
  const heroIndexLabel = document.querySelector('.art-index');

  if (heroSlides.length && heroIndexLabel) {
    let activeHeroIndex = 0;

    function showHeroSlide(index) {
      activeHeroIndex = (index + heroSlides.length) % heroSlides.length;
      heroSlides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === activeHeroIndex);
      });
      heroIndexLabel.textContent = `AD / ${String(activeHeroIndex + 1).padStart(2, '0')}`;
    }

    setInterval(() => {
      showHeroSlide(activeHeroIndex + 1);
    }, 9000);
  }

  const reviewForm = document.querySelector('#review-form');
  const testimonialGrid = document.querySelector('#testimonial-grid');
  const adminKeyInput = document.querySelector('#admin-key');
  const adminLoginButton = document.querySelector('#admin-login');
  const adminStatus = document.querySelector('#admin-status');
  const reviewStorageKey = 'abraham-daud-reviews';
  const adminSecretKey = '123!@#';
  let isAdminLoggedIn = false;

  function getStoredReviews() {
    try {
      const stored = localStorage.getItem(reviewStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveReviews(reviews) {
    try {
      localStorage.setItem(reviewStorageKey, JSON.stringify(reviews));
    } catch {
      // Abaikan jika browser menolak penyimpanan.
    }
  }

  function removeReviewById(reviewId) {
    const reviews = getStoredReviews().filter((review) => review.id !== reviewId);
    saveReviews(reviews);
    renderReviews();
  }

  function renderReviews() {
    if (!testimonialGrid) return;

    const reviews = getStoredReviews();
    testimonialGrid.innerHTML = '';

    if (!reviews.length) {
      testimonialGrid.innerHTML = '<div class="empty-review">Belum ada ulasan. Jadilah orang pertama yang mengirimkan pengalaman Anda di sini.</div>';
      return;
    }

    const reviewItems = reviews.slice().reverse();
    const track = document.createElement('div');
    track.className = 'testimonial-track';

    [...reviewItems, ...reviewItems].forEach((review) => {
      const card = document.createElement('blockquote');
      card.className = 'testimonial-card';
      card.innerHTML = `
        <p>“${review.message}”</p>
        <footer>
          <strong>${review.name}</strong>
          <span>${review.role}</span>
        </footer>
      `;

      if (isAdminLoggedIn) {
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'review-delete';
        deleteButton.setAttribute('aria-label', `Hapus ulasan dari ${review.name}`);
        deleteButton.textContent = '×';
        deleteButton.addEventListener('click', () => removeReviewById(review.id));
        card.appendChild(deleteButton);
      }

      track.appendChild(card);
    });

    testimonialGrid.appendChild(track);
  }

  if (adminKeyInput && adminLoginButton && adminStatus) {
    adminLoginButton.addEventListener('click', () => {
      const enteredKey = adminKeyInput.value.trim();

      if (enteredKey === adminSecretKey) {
        isAdminLoggedIn = true;
        adminStatus.textContent = 'Admin aktif — Anda dapat menghapus ulasan.';
        adminStatus.style.color = 'var(--ink)';
        renderReviews();
      } else {
        isAdminLoggedIn = false;
        adminStatus.textContent = 'Kunci admin salah. Coba lagi.';
        adminStatus.style.color = 'var(--red)';
        renderReviews();
      }
    });

    adminKeyInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        adminLoginButton.click();
      }
    });
  }

  if (reviewForm && testimonialGrid) {
    renderReviews();

    reviewForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(reviewForm);
      const name = String(formData.get('name') || '').trim();
      const role = String(formData.get('role') || '').trim();
      const message = String(formData.get('message') || '').trim();

      if (!name || !role || !message) {
        return;
      }

      const reviews = getStoredReviews();
      reviews.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        role,
        message
      });
      saveReviews(reviews);
      renderReviews();
      reviewForm.reset();
    });
  }

  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    const contactSubmitStatus = document.querySelector('#contact-submit-status');

    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(contactForm);
      const name = String(formData.get('nama') || '').trim();
      const email = String(formData.get('email') || '').trim();
      const message = String(formData.get('pesan') || '').trim();
      const subject = 'Pesan dari website Abraham Daud';
      const body = `Nama: ${name}\nEmail: ${email}\n\nPesan:\n${message}`;
      const composeUrl = new URL('https://mail.google.com/mail/');
      composeUrl.searchParams.set('view', 'cm');
      composeUrl.searchParams.set('fs', '1');
      composeUrl.searchParams.set('to', 'abrahamdaud511@gmail.com');
      composeUrl.searchParams.set('su', subject);
      composeUrl.searchParams.set('body', body);

      const fallbackLink = document.createElement('a');
      fallbackLink.href = composeUrl.toString();
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      fallbackLink.textContent = 'Buka Gmail';

      const composeWindow = window.open(composeUrl.toString(), '_blank');
      if (composeWindow) composeWindow.opener = null;

      if (contactSubmitStatus) {
        contactSubmitStatus.replaceChildren(
          document.createTextNode('Draf sudah disiapkan. Klik Kirim di Gmail untuk mengirim, atau '),
          fallbackLink,
          document.createTextNode(' jika Gmail tidak terbuka otomatis.')
        );
      }
    });
  }

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.hero');
  if (!reducedMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let pointerFrame = 0;
    let pointerPosition;

    hero.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      pointerPosition = { x: event.clientX, y: event.clientY };
      if (pointerFrame) return;

      pointerFrame = requestAnimationFrame(() => {
        const bounds = hero.getBoundingClientRect();
        const offsetX = (pointerPosition.x - bounds.left) / bounds.width - 0.5;
        const offsetY = (pointerPosition.y - bounds.top) / bounds.height - 0.5;
        hero.style.setProperty('--hero-bg-x', `${offsetX * -20}px`);
        hero.style.setProperty('--hero-bg-y', `${offsetY * -20}px`);
        pointerFrame = 0;
      });
    });

    hero.addEventListener('pointerleave', () => {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      hero.style.setProperty('--hero-bg-x', '0px');
      hero.style.setProperty('--hero-bg-y', '0px');
    });
  }

  const profileGallery = document.querySelector('#profile-gallery');
  const previousGalleryButton = document.querySelector('.gallery-previous');
  const nextGalleryButton = document.querySelector('.gallery-next');
  const gallerySlides = [...profileGallery.querySelectorAll('figure')];
  let activeGalleryIndex = 0;

  function updateGalleryControls() {
    previousGalleryButton.disabled = activeGalleryIndex === 0;
    nextGalleryButton.disabled = activeGalleryIndex === gallerySlides.length - 1;
    const slideGap = parseFloat(getComputedStyle(profileGallery).gap) || 0;
    profileGallery.style.transform = `translateX(-${activeGalleryIndex * (profileGallery.clientWidth + slideGap)}px)`;
    gallerySlides.forEach((slide, index) => {
      slide.setAttribute('aria-hidden', String(index !== activeGalleryIndex));
    });
  }

  function scrollGallery(direction) {
    activeGalleryIndex = Math.max(0, Math.min(gallerySlides.length - 1, activeGalleryIndex + direction));
    updateGalleryControls();
  }

  previousGalleryButton.addEventListener('click', () => scrollGallery(-1));
  nextGalleryButton.addEventListener('click', () => scrollGallery(1));
  profileGallery.addEventListener('scroll', updateGalleryControls, { passive: true });
  window.addEventListener('resize', updateGalleryControls);
  profileGallery.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      scrollGallery(event.key === 'ArrowRight' ? 1 : -1);
    }
  });

  let isDraggingGallery = false;
  let dragStartX = 0;
  let dragDistance = 0;

  if (!reducedMotion && gallerySlides.length > 1) {
    window.setInterval(() => {
      if (document.visibilityState !== 'visible' || isDraggingGallery) return;
      activeGalleryIndex = (activeGalleryIndex + 1) % gallerySlides.length;
      updateGalleryControls();
    }, 9000);
  }

  profileGallery.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    isDraggingGallery = true;
    dragStartX = event.clientX;
    dragDistance = 0;
    profileGallery.classList.add('is-dragging');
    profileGallery.setPointerCapture(event.pointerId);
  });

  profileGallery.addEventListener('pointermove', (event) => {
    if (!isDraggingGallery) return;
    dragDistance = event.clientX - dragStartX;
    const slideGap = parseFloat(getComputedStyle(profileGallery).gap) || 0;
    const slideOffset = -activeGalleryIndex * (profileGallery.clientWidth + slideGap) + dragDistance;
    profileGallery.style.transform = `translateX(${slideOffset}px)`;
  });

  function stopGalleryDrag() {
    if (Math.abs(dragDistance) > 50) {
      activeGalleryIndex = Math.max(0, Math.min(gallerySlides.length - 1, activeGalleryIndex + (dragDistance < 0 ? 1 : -1)));
    }
    isDraggingGallery = false;
    dragDistance = 0;
    profileGallery.classList.remove('is-dragging');
    updateGalleryControls();
  }

  profileGallery.addEventListener('pointerup', stopGalleryDrag);
  profileGallery.addEventListener('pointercancel', stopGalleryDrag);
  window.addEventListener('resize', updateGalleryControls);
  updateGalleryControls();

  const titleName = 'Portofolio — Abraham Daud';
  const loadingScreen = document.querySelector('.loading-screen');
  const loadingStartedAt = performance.now();
  let loadingFinished = false;

  if (!reducedMotion) {
    document.title = `A| ${titleName}`;
    window.setTimeout(() => {
      let cursorVisible = true;
      document.title = `AD| ${titleName}`;
      window.setInterval(() => {
        cursorVisible = !cursorVisible;
        document.title = `AD${cursorVisible ? '|' : ' '} ${titleName}`;
      }, 600);
    }, 260);
  }

  function finishLoading() {
    if (loadingFinished) return;
    loadingFinished = true;
    const minimumDuration = 700;
    const remainingTime = Math.max(0, minimumDuration - (performance.now() - loadingStartedAt));

    window.setTimeout(() => {
      loadingScreen.classList.add('is-leaving');
      window.setTimeout(() => root.classList.remove('is-loading'), 440);
    }, remainingTime);
  }

  window.addEventListener('load', finishLoading, { once: true });
  window.setTimeout(finishLoading, 8000);
  if (document.readyState === 'complete') finishLoading();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePortfolio, { once: true });
} else {
  initializePortfolio();
}