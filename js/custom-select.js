/* Custom themed select dropdowns */
(function () {
  'use strict';

  var selects = document.querySelectorAll('.custom-select');
  if (!selects.length) return;

  selects.forEach(function (wrapper) {
    var trigger = wrapper.querySelector('.custom-select-trigger');
    var valueSpan = wrapper.querySelector('.custom-select-value');
    var optionsList = wrapper.querySelector('.custom-select-options');
    var items = wrapper.querySelectorAll('[role="option"]');
    var hiddenInput = wrapper.querySelector('input[type="hidden"]');

    if (!trigger || !optionsList || !items.length) return;

    if (!hiddenInput.value) valueSpan.classList.add('placeholder');

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var isOpen = wrapper.classList.contains('open');
      closeAllSelects();
      if (!isOpen) {
        wrapper.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    items.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        items.forEach(function (i) { i.classList.remove('selected'); });
        item.classList.add('selected');
        hiddenInput.value = item.getAttribute('data-value');
        valueSpan.textContent = item.textContent;
        valueSpan.classList.remove('placeholder');
        wrapper.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
      });

      item.addEventListener('mouseenter', function () {
        items.forEach(function (i) { i.classList.remove('focused'); });
        item.classList.add('focused');
      });
    });

    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        if (!wrapper.classList.contains('open')) {
          wrapper.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      } else if (e.key === 'Escape') {
        wrapper.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  function closeAllSelects() {
    selects.forEach(function (s) {
      s.classList.remove('open');
      var t = s.querySelector('.custom-select-trigger');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', closeAllSelects);
})();
