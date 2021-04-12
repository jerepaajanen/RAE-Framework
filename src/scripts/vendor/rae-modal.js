(function ($) {

    'use strict';

    $.fn.raeModal = function (options) {

        // This is the easiest way to have default settings.
        var settings = $.extend({
            // These are the defaults.
            transition: 'fade', // String: Transition to apply. 'slide', 'fade', 'both' or 'none'
            transitionSpeed: 250,
            transitionEasing: 'linear', // String: 'linear', 'swing', 'default'.
            toggle: '[data-modal-toggle]' // Selector class for the element acting as a button.

        }, options);


        this.each(function () {

            var wrapper = $(this),
                modalClose = '[data-modal-close]',
                modalOpen = settings.toggle,
                overlaySelector = settings.overlay;

            $.fn.transitions = function (callback) {
                var transition = {};
                if (settings.transition === 'fade') {
                    transition.opacity = 'toggle';
                }
                if (settings.transition === 'slide') {
                    transition.height = 'toggle';
                }
                if (settings.transition === 'both') {
                    transition.opacity = 'toggle';
                    transition.height = 'toggle';
                }

                return this.animate(transition, settings.transitionSpeed, settings.transitionEasing, callback);

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
