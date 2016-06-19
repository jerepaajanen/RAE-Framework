(function () {

    'use strict';

    // Javascript Detection
    $('html').removeClass('no-js').addClass('js');

    // Touch Device Detection
    var isTouchDevice = 'ontouchstart' in document.documentElement;
    if (isTouchDevice) {
        $('html').addClass('touch');
    } else {
        $('html').addClass('no-touch');
    }


    // DOM ready
    $(function () {


    });

}());
