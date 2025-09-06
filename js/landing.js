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

// Form submission
document.querySelector('.contact-form form')?.addEventListener('submit', function(e) {
    e.preventDefault();

    // Ambil data form
    const name = this.querySelector('input[type="text"]').value;
    const email = this.querySelector('input[type="email"]').value;
    const message = this.querySelector('textarea').value;

    // Tampilkan pesan sukses
    alert('Terima kasih! Pesan Anda telah terkirim.');

    // Reset form
    this.reset();
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

// Tambahkan animasi ke CSS
const style = document.createElement('style');
style.textContent = `
    .feature-card, .about-content, .contact-content {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }

    .feature-card.animate, .about-content.animate, .contact-content.animate {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

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

// --- Kode Slider Hero Section yang Telah Diperbaiki ---
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
    const SLIDE_INTERVAL = 3500; // 3.5 detik

    // Fungsi untuk menampilkan slide
    function showSlide(index) {
        // Geser slider menggunakan transform
        sliderWrapper.style.transform = `translateX(-${index * 100}%)`;

        // Reset semua dot
        dots.forEach(dot => {
            dot.classList.remove('active');
        });

        // Aktifkan dot yang sesuai
        dots[index].classList.add('active');

        currentSlide = index;
    }

    // Fungsi untuk slide berikutnya
    function nextSlide() {
        let next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }

    // Fungsi untuk slide sebelumnya
    function prevSlide() {
        let prev = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prev);
    }

    // Fungsi untuk memulai slider otomatis
    function startSlider() {
        slideInterval = setInterval(nextSlide, SLIDE_INTERVAL);
    }

    // Fungsi untuk menghentikan slider otomatis
    function stopSlider() {
        clearInterval(slideInterval);
    }

    // Event listener untuk tombol next
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            nextSlide();
            stopSlider();
            startSlider(); // Restart timer
        });
    }

    // Event listener untuk tombol prev
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            prevSlide();
            stopSlider();
            startSlider(); // Restart timer
        });
    }

    // Event listener untuk dot indicators
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            showSlide(index);
            stopSlider();
            startSlider(); // Restart timer
        });
    });

    // Pause slider saat mouse hover
    sliderContainer.addEventListener('mouseenter', stopSlider);
    sliderContainer.addEventListener('mouseleave', startSlider);

    // Inisialisasi slider
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
    const SLIDE_INTERVAL = 5000; // 5 detik
    
    // Fungsi untuk menampilkan slide
    function showSlide(index) {
        // Geser slide menggunakan transform
        sliderWrapper.style.transform = `translateX(-${index * 100}%)`;
        
        // Reset semua dot
        dots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        // Aktifkan dot yang sesuai
        dots[index].classList.add('active');
        
        currentSlide = index;
    }
    
    // Fungsi untuk slide berikutnya
    function nextSlide() {
        let next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }
    
    // Fungsi untuk slide sebelumnya
    function prevSlide() {
        let prev = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prev);
    }
    
    // Fungsi untuk memulai slider otomatis
    function startSlider() {
        slideInterval = setInterval(nextSlide, SLIDE_INTERVAL);
    }
    
    // Fungsi untuk menghentikan slider otomatis
    function stopSlider() {
        clearInterval(slideInterval);
    }
    
    // Event listener untuk tombol next
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            nextSlide();
            stopSlider();
            startSlider(); // Restart timer
        });
    }
    
    // Event listener untuk tombol prev
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            prevSlide();
            stopSlider();
            startSlider(); // Restart timer
        });
    }
    
    // Event listener untuk dot indicators
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            showSlide(index);
            stopSlider();
            startSlider(); // Restart timer
        });
    });
    
    // Pause slider saat mouse hover
    sliderContainer.addEventListener('mouseenter', stopSlider);
    sliderContainer.addEventListener('mouseleave', startSlider);
    
    // Inisialisasi slider
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