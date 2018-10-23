(function () {

    'use strict';

    // Javascript Detection
    function checkJs() {

        $('html').removeClass('no-js').addClass('js');
    }
    checkJs();

    // Touch Device Detection
    function checkTouch() {
        //Check Device
        var isTouch = ('ontouchstart' in document.documentElement);
        //Check Device //All Touch Devices
        if (isTouch) {
            $('html').addClass('touch');
        } else {
            $('html').addClass('no-touch');
        }
    }
    checkTouch();


    // DOM ready
    $(function () {


    });

}());
