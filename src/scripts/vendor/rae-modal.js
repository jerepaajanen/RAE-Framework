(function ($) {

    'use strict';

    $.fn.raeModal = function (settings) {

        // This is the easiest way to have default settings.
        var options = $.extend({
            // These are the defaults.
            transition: 'fade', // String: Transition to apply. 'slide', 'fade', 'both' or 'none'
            transitionSpeed: 250,
            transitionEasing: 'linear', // String: 'linear', 'swing', 'default'.
            toggle: '[data-modal-toggle]' // Selector class for the element acting as a button.

        }, settings);


        this.each(function () {

            var wrapper = $(this),
                modalClose = '[data-modal-close]',
                modalOpen = options.toggle,
                overlaySelector = options.overlay;

            $.fn.transitions = function (callback) {
                var transition = {};
                if (options.transition === 'fade') {
                    transition.opacity = 'toggle';
                }
                if (options.transition === 'slide') {
                    transition.height = 'toggle';
                }
                if (options.transition === 'both') {
                    transition.opacity = 'toggle';
                    transition.height = 'toggle';
                }

                return this.animate(transition, options.transitionSpeed, options.transitionEasing, callback);

            };



            // Toggle responsive navigation
            $(modalOpen).add(modalClose).click(function () {


                if ($(':visible', wrapper).length < 1) {
                    $(wrapper).hide().toggleClass('is-open').transitions(function () {
                        $(this).removeAttr('style');
                    });
                    $('body').addClass('modal-open');

                } else {

                    $(wrapper).stop(true, true).transitions(function () {
                        //$(modalOpen).toggleClass('is-active is-inactive');
                        $(this).toggleClass('is-open').removeAttr('style');
                    });
                    $('body').removeClass('modal-open');
                }

                return false;
            });

        });
    };

}(jQuery));
