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

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            
            // Tutup menu mobile jika terbuka
            closeMobileMenu();
        }
    });
});

// Animation on scroll
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

// Observe elements
document.querySelectorAll('.feature-card, .about-content, .contact-content').forEach(el => {
    observer.observe(el);
});

// Fungsi untuk menangani navigasi dan highlight menu
function initNavigation() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const footerLinks = document.querySelectorAll('.footer-nav-link');
    
    // Fungsi untuk mengupdate menu aktif
    function updateActiveNav() {
        let currentSection = '';
        const scrollY = window.pageYOffset;
        const headerHeight = document.querySelector('.main-header').offsetHeight;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - headerHeight - 50;
            const sectionId = section.getAttribute('id');
            
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                currentSection = sectionId;
            }
        });
        
        // Hapus kelas aktif dari semua link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }
    
    // Event listener untuk scroll
    window.addEventListener('scroll', updateActiveNav);
    
    // Event listener untuk link footer
    footerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('data-section');
            const targetElement = document.getElementById(targetSection);
            
            if (targetElement) {
                // Hitung posisi scroll dengan memperhitungkan tinggi header
                const headerOffset = 80;
                const elementPosition = targetElement.offsetTop;
                const offsetPosition = elementPosition - headerOffset;

                // Scroll ke section target
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
                
                // Update menu aktif setelah scroll selesai
                setTimeout(() => {
                    updateActiveNav();
                }, 1000);
                
                // Tutup menu mobile jika terbuka
                closeMobileMenu();
            }
        });
    });
    
    // Inisialisasi saat halaman dimuat
    updateActiveNav();
}

// Fungsi untuk toggle mobile menu
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger-menu');
    const nav = document.querySelector('.main-nav');
    
    if (hamburger && nav) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            nav.classList.toggle('active');
            
            // Toggle body scroll ketika menu dibuka/ditutup
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
        });
    }
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

// Fungsi untuk menutup mobile menu
function closeMobileMenu() {
    const hamburger = document.querySelector('.hamburger-menu');
    const nav = document.querySelector('.main-nav');
    
    if (hamburger && nav) {
        hamburger.classList.remove('active');
        nav.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// --- Kode Slider Hero Section ---
(function() {
    const sliderContainer = document.querySelector('.slider-container');
    if (!sliderContainer) return;

    const sliderWrapper = sliderContainer.querySelector('.slider-wrapper');
    const slides = sliderContainer.querySelectorAll('.slide');
    const dots = sliderContainer.querySelectorAll('.slider-dots .dot');
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

    function nextSlide() {
        let next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }

    function prevSlide() {
        let prev = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prev);
    }

    function startSlider() {
        stopSlider(); // pastikan clear dulu
        slideInterval = setInterval(nextSlide, SLIDE_INTERVAL);
    }

    function stopSlider() {
        if (slideInterval) {
            clearInterval(slideInterval);
            slideInterval = null;
        }
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            startSlider(); // reset timer
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            startSlider(); // reset timer
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            startSlider(); // reset timer
        });
    });

    // Pause saat hover
    sliderContainer.addEventListener('mouseenter', stopSlider);
    sliderContainer.addEventListener('mouseleave', startSlider);

    // Inisialisasi
    showSlide(0);
    startSlider();
})();


// --- Kode Slider About Section ---
(function() {
    const sliderContainer = document.querySelector('.about-slider-container');
    if (!sliderContainer) return;

    const sliderWrapper = sliderContainer.querySelector('.about-slider-wrapper');
    const slides = sliderContainer.querySelectorAll('.about-slide');
    const dots = sliderContainer.querySelectorAll('.slider-dots-about .dot');
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
    
    function nextSlide() {
        let next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }
    
    function prevSlide() {
        let prev = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prev);
    }
    
    function startSlider() {
        stopSlider(); // clear sebelum set baru
        slideInterval = setInterval(nextSlide, SLIDE_INTERVAL);
    }
    
    function stopSlider() {
        if (slideInterval) {
            clearInterval(slideInterval);
            slideInterval = null;
        }
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            startSlider();
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            startSlider();
        });
    }
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            startSlider();
        });
    });
    
    // Pause saat hover
    sliderContainer.addEventListener('mouseenter', stopSlider);
    sliderContainer.addEventListener('mouseleave', startSlider);
    
    // Inisialisasi
    showSlide(0);
    startSlider();
})();


// Panggil fungsi saat DOM siap
document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi navigasi
    initNavigation();
    // Inisialisasi mobile menu
    initMobileMenu();
    // Pastikan halaman di-scroll ke atas saat dimuat
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

// jadikan .main-nav sebagai panel pada tablet/HP
function markNavPanel() {
  const nav = document.querySelector('.main-nav');
  if (!nav) return;
  if (window.innerWidth <= 1023) nav.classList.add('is-panel');
  else nav.classList.remove('is-panel','active');
}
window.addEventListener('resize', markNavPanel);
document.addEventListener('DOMContentLoaded', markNavPanel);

// Chart.js untuk Perbandingan Sebelum vs Sesudah Pemakaian Alat Smart GreenHeat
document.addEventListener("DOMContentLoaded", function () {
  const ctx = document.getElementById("Provide");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Kondisi Percobaan"],
      datasets: [
        {
          label: "Sebelum Pakai Alat Smart GreenHeat",
          data: [21],
          backgroundColor: "rgba(255, 154, 0, 0.7)",
          borderColor: "rgba(255, 154, 0, 1)",
          borderWidth: 1,
        },
        {
          label: "Setelah Pakai Alat Smart GreenHeat",
          data: [7],
          backgroundColor: "rgba(79, 32, 13, 0.7)",
          borderColor: "rgba(79, 32, 13, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // ✅ Supaya responsif
      plugins: {
        legend: {
          position: "top",
          labels: { boxWidth: 20 },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Hari" },
          ticks: { stepSize: 5 },
        },
      },
    },
  });
});


