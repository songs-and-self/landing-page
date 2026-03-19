/* ============================================
   Songs & Self Music Therapy — Main JavaScript
   ============================================ */

(function () {
  'use strict';

  // --- Sticky Header shadow on scroll ---
  var header = document.getElementById('siteHeader');

  function handleScroll() {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });

  // --- Slide-out Menu ---
  var menuToggle = document.getElementById('menuToggle');
  var mainNav = document.getElementById('mainNav');
  var navOverlay = document.getElementById('navOverlay');
  var navClose = document.getElementById('navClose');

  function openMenu() {
    mainNav.classList.add('open');
    navOverlay.classList.add('active');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mainNav.classList.remove('open');
    navOverlay.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
  }

  menuToggle.addEventListener('click', function () {
    if (mainNav.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close button inside nav
  navClose.addEventListener('click', function () {
    closeMenu();
    menuToggle.focus();
  });

  // Close on overlay click
  navOverlay.addEventListener('click', closeMenu);

  // Close on nav link click
  mainNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mainNav.classList.contains('open')) {
      closeMenu();
      menuToggle.focus();
    }
  });

  // --- Submenu keyboard accessibility ---
  var submenuParents = document.querySelectorAll('.has-submenu > a');
  submenuParents.forEach(function (trigger) {
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var expanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !expanded);
      }
    });
  });

  // --- Scroll-triggered Fade Animations ---
  var fadeElements = document.querySelectorAll(
    '.about-text, .about-image, .therapy-intro, .therapy-image, .who-i-work-with-banner, .expect-intro, .comparison-table, ' +
    '.approach-card, .contact-text, .contact-form, .step, .testimonial-card, ' +
    '.faq-list, .areas-text, .areas-map'
  );

  var staggerElements = document.querySelectorAll(
    '.client-grid, .registration-badges'
  );

  fadeElements.forEach(function (el) {
    el.classList.add('fade-in');
  });

  staggerElements.forEach(function (el) {
    el.classList.add('stagger-in');
  });

  // Respect prefers-reduced-motion
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    fadeElements.forEach(function (el) {
      observer.observe(el);
    });

    staggerElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // --- Smooth Scroll for Anchor Links ---
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (href === '#') return;

      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        var offset = header.offsetHeight + 20;
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });

        // Move focus to target for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });

  // --- Cookie Banner ---
  var cookieBanner = document.getElementById('cookieBanner');
  var cookieAccept = document.getElementById('cookieAccept');
  var cookieDecline = document.getElementById('cookieDecline');

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }

  if (!getCookie('cookie_consent')) {
    cookieBanner.removeAttribute('hidden');
  }

  cookieAccept.addEventListener('click', function () {
    setCookie('cookie_consent', 'accepted', 365);
    cookieBanner.setAttribute('hidden', '');
  });

  cookieDecline.addEventListener('click', function () {
    setCookie('cookie_consent', 'declined', 365);
    cookieBanner.setAttribute('hidden', '');
  });

  // --- Contact Form Validation & Submission ---
  var contactForm = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var nameInput = this.querySelector('#name');
      var email = this.querySelector('#email');
      var privacy = this.querySelector('[name="privacy"]');
      var valid = true;

      this.querySelectorAll('.form-error').forEach(function (el) {
        el.remove();
      });
      this.querySelectorAll('.input-error').forEach(function (el) {
        el.classList.remove('input-error');
      });

      if (!nameInput.value.trim()) {
        showError(nameInput, 'Please enter your name');
        valid = false;
      }

      if (!email.value.trim() || !isValidEmail(email.value)) {
        showError(email, 'Please enter a valid email address');
        valid = false;
      }

      if (!privacy.checked) {
        showError(privacy.closest('.form-group'), 'Please agree to the privacy policy');
        valid = false;
      }

      if (valid) {
        var btn = this.querySelector('.btn-submit');
        btn.textContent = 'Sending...';
        btn.disabled = true;

        var formData = new FormData(this);

        fetch(this.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        }).then(function (response) {
          if (response.ok) {
            contactForm.style.transition = 'opacity 0.4s ease';
            contactForm.style.opacity = '0';
            setTimeout(function () {
              contactForm.style.display = 'none';
              formSuccess.removeAttribute('hidden');
              formSuccess.style.opacity = '0';
              formSuccess.style.transition = 'opacity 0.5s ease';
              requestAnimationFrame(function () {
                formSuccess.style.opacity = '1';
              });
            }, 400);
          } else {
            return response.json().then(function (data) {
              if (data && data.errors) {
                btn.textContent = data.errors.map(function (err) { return err.message; }).join(', ');
              } else {
                btn.textContent = 'Something went wrong — please try again';
              }
              btn.disabled = false;
            });
          }
        }).catch(function () {
          btn.textContent = 'Something went wrong — please try again';
          btn.disabled = false;
        });
      }
    });
  }

  function showError(input, message) {
    var error = document.createElement('span');
    error.className = 'form-error';
    error.textContent = message;
    error.style.cssText = 'display:block;font-size:0.75rem;color:#e87;margin-top:0.25rem;';

    if (input.tagName === 'DIV') {
      input.appendChild(error);
    } else {
      input.classList.add('input-error');
      input.style.borderColor = '#e87';
      input.parentNode.appendChild(error);
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

})();
