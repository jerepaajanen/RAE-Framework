(function () {

  'use strict';

  // Javascript Detection
  function checkJs() {

    $('html').removeClass('no-js').addClass('js');
  }
  checkJs();

  // Touch Device Detection
  function checkTouch() {
    var isTouch = ('ontouchstart' in document.documentElement);
    if (isTouch) {
      $('html').addClass('touch');
    } else {
      $('html').addClass('no-touch');
    }
  }
  checkTouch();


  // DOM ready
  $(function () {

    // Init Responsive Nav
    $('.js-primary-nav').raeNavResponsive({});

    // Init Modal
    //$('.js-modal').raeModal({});

  });

}());
