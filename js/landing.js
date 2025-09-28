// Smooth scrolling untuk link navigasi
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    // Jangan terapkan pada link footer yang sudah memiliki handler khusus
    if (this.classList.contains('footer-nav-link')) return;

    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      // Hitung posisi scroll dengan memperhitungkan tinggi header
      const headerOffset = 80;
      const elementPosition = target.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({ top: offsetPosition, behavior: "smooth" });

      // Tutup menu mobile jika terbuka
      closeMobileMenu();
    }
  });
});

// Animation on scroll
const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('animate'); });
}, observerOptions);

// Observe elements
document.querySelectorAll('.feature-card, .about-content, .contact-content').forEach(el => observer.observe(el));

// Fungsi untuk menangani navigasi dan highlight menu
function initNavigation() {
  const sections   = document.querySelectorAll('section[id]');
  const navLinks   = document.querySelectorAll('.nav-link');
  const footerLinks= document.querySelectorAll('.footer-nav-link');

  function updateActiveNav() {
    let currentSection = '';
    const scrollY = window.pageYOffset;
    const headerHeight = document.querySelector('.main-header').offsetHeight;

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - headerHeight - 50;
      const sectionId = section.getAttribute('id');
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) currentSection = sectionId;
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) link.classList.add('active');
    });
  }

  window.addEventListener('scroll', updateActiveNav);

  footerLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetSection = this.getAttribute('data-section');
      const targetElement = document.getElementById(targetSection);
      if (!targetElement) return;

      const headerOffset = 80;
      const offsetPosition = targetElement.offsetTop - headerOffset;

      window.scrollTo({ top: offsetPosition, behavior: "smooth" });

      setTimeout(updateActiveNav, 1000);
      closeMobileMenu();
    });
  });

  updateActiveNav();
}

// Toggle mobile menu
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger-menu');
  const nav = document.querySelector('.main-nav');
  if (!hamburger || !nav) return;

  hamburger.addEventListener('click', function() {
    this.classList.toggle('active');
    nav.classList.toggle('active');
    document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
  });
}

// jadikan .main-nav panel di tablet/HP
function markNavPanel(){
  const nav = document.querySelector('.main-nav');
  if (!nav) return;
  if (window.innerWidth <= 1023) nav.classList.add('is-panel');
  else nav.classList.remove('is-panel','active');
}
window.addEventListener('resize', () => {
  markNavPanel();
  if (window.innerWidth >= 1024) closeMobileMenu();
});
document.addEventListener('DOMContentLoaded', markNavPanel);

// Tutup mobile menu
function closeMobileMenu() {
  const hamburger = document.querySelector('.hamburger-menu');
  const nav = document.querySelector('.main-nav');
  if (!hamburger || !nav) return;
  hamburger.classList.remove('active');
  nav.classList.remove('active');
  document.body.style.overflow = '';
}

/* ----------------------
   Slider: Hero Section
   ---------------------- */
(function() {
  const sliderContainer = document.querySelector('.slider-container');
  if (!sliderContainer) return;

  const sliderWrapper = sliderContainer.querySelector('.slider-wrapper');
  const slides  = sliderContainer.querySelectorAll('.slide');
  const dots    = sliderContainer.querySelectorAll('.slider-dots .dot');
  const prevBtn = sliderContainer.querySelector('.slider-prev');
  const nextBtn = sliderContainer.querySelector('.slider-next');

  let currentSlide = 0;
  let slideInterval = null;
  const SLIDE_INTERVAL = 5000; // 5 detik

  function showSlide(index) {
    sliderWrapper.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach(dot => dot.classList.remove('active'));
    dots[index].classList.add('active');
    currentSlide = index;
  }
  function nextSlide() { showSlide((currentSlide + 1) % slides.length); }
  function prevSlide() { showSlide((currentSlide - 1 + slides.length) % slides.length); }

  function startSlider() { stopSlider(); slideInterval = setInterval(nextSlide, SLIDE_INTERVAL); }
  function stopSlider()  { if (slideInterval) { clearInterval(slideInterval); slideInterval = null; } }

  nextBtn?.addEventListener('click', () => { nextSlide(); startSlider(); });
  prevBtn?.addEventListener('click', () => { prevSlide(); startSlider(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { showSlide(i); startSlider(); }));

  sliderContainer.addEventListener('mouseenter', stopSlider);
  sliderContainer.addEventListener('mouseleave', startSlider);

  showSlide(0);
  startSlider();
})();

/* -----------------------
   Slider: About Section
   ----------------------- */
(function() {
  const sliderContainer = document.querySelector('.about-slider-container');
  if (!sliderContainer) return;

  const sliderWrapper = sliderContainer.querySelector('.about-slider-wrapper');
  const slides  = sliderContainer.querySelectorAll('.about-slide');
  const dots    = sliderContainer.querySelectorAll('.slider-dots-about .dot');
  const prevBtn = sliderContainer.querySelector('.slider-prev-about');
  const nextBtn = sliderContainer.querySelector('.slider-next-about');

  let currentSlide = 0;
  let slideInterval = null;
  const SLIDE_INTERVAL = 10000; // 10 detik

  function showSlide(index) {
    sliderWrapper.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach(dot => dot.classList.remove('active'));
    dots[index].classList.add('active');
    currentSlide = index;
  }
  function nextSlide() { showSlide((currentSlide + 1) % slides.length); }
  function prevSlide() { showSlide((currentSlide - 1 + slides.length) % slides.length); }

  function startSlider() { stopSlider(); slideInterval = setInterval(nextSlide, SLIDE_INTERVAL); }
  function stopSlider()  { if (slideInterval) { clearInterval(slideInterval); slideInterval = null; } }

  nextBtn?.addEventListener('click', () => { nextSlide(); startSlider(); });
  prevBtn?.addEventListener('click', () => { prevSlide(); startSlider(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { showSlide(i); startSlider(); }));

  sliderContainer.addEventListener('mouseenter', stopSlider);
  sliderContainer.addEventListener('mouseleave', startSlider);

  showSlide(0);
  startSlider();
})();

/* -----------------------
   DOM Ready initializers
   ----------------------- */
document.addEventListener('DOMContentLoaded', function() {
  initNavigation();
  initMobileMenu();
  window.scrollTo(0, 0);

  // Tutup menu mobile saat klik di luar menu
  document.addEventListener('click', function(e) {
    const hamburger = document.querySelector('.hamburger-menu');
    const nav = document.querySelector('.main-nav');
    if (nav && nav.classList.contains('active') &&
        !e.target.closest('.main-nav') &&
        !e.target.closest('.hamburger-menu')) {
      closeMobileMenu();
    }
  });
});

/* -----------------------
   Chart: Improve Section
   ----------------------- */
document.addEventListener("DOMContentLoaded", function () {
  const ctx = document.getElementById("Provide");
  if (!ctx) return;

  // register plugin datalabels
  Chart.register(ChartDataLabels);

  const formatID = (v) => new Intl.NumberFormat("id-ID").format(v);

  const datasets = [
    {
      label: "Sebelum Pakai Alat Smart GreenHeat",
      data: [180],
      backgroundColor: "rgba(255, 154, 0, 0.7)",
      borderColor: "rgba(255, 154, 0, 1)",
      borderWidth: 1,
      borderRadius: 8
    },
    {
      label: "Setelah Pakai Alat Smart GreenHeat",
      data: [120],
      backgroundColor: "rgba(79, 32, 13, 0.7)",
      borderColor: "rgba(79, 32, 13, 1)",
      borderWidth: 1,
      borderRadius: 8
    }
  ];

  const maxVal = Math.max(...datasets.flatMap(d => d.data));
  const suggestedMax = Math.ceil(maxVal * 1.15);

  new Chart(ctx, {
    type: "bar",
    data: { labels: ["Kondisi Percobaan Pengeringan per (25Ton)"], datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 24, right: 8 } },
      plugins: {
        legend: { position: "top", labels: { boxWidth: 20 } },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatID(c.raw)} Hari` } },
        datalabels: {
          anchor: 'end', align: 'top', offset: 4, clamp: true,
          color: '#4F200D', font: { weight: '600', size: 12 },
          formatter: (v) => `${formatID(v)} Hari`
        }
      },
      scales: {
        x: { grid: { display: true, drawOnChartArea: true } },
        y: {
          beginAtZero: true, suggestedMax,
          title: { display: true, text: "Hari" },
          ticks: { stepSize: 5, callback: (v) => `${formatID(v)}` }
        }
      },
      categoryPercentage: 0.6,
      barPercentage: 0.8,
      animation: { duration: 800, easing: 'easeOutQuart' }
    }
  });
});

/* -----------------------
   Maps fallback handler
   ----------------------- */
// NOTE: pastikan di HTML iframe maps pakai id="gmap" dan ada <div id="gmap-fallback" hidden>
(function(){
  const iframe   = document.getElementById('gmap');
  const fallback = document.getElementById('gmap-fallback');
  if (!iframe || !fallback) return;

  let loaded = false;
  const TIMEOUT_MS = 8000; // jika 8 detik belum 'load', tampilkan fallback

  iframe.addEventListener('load', () => {
    loaded = true;
    fallback.hidden = true;
  });

  setTimeout(() => { if (!loaded) fallback.hidden = false; }, TIMEOUT_MS);
})();
