(function ($) {

    'use strict';

    $.fn.raeNavResponsive = function (settings) {

        // This is the easiest way to have default settings.
        var options = $.extend({
            // These are the defaults.
            transition: 'slide', // String: Transition to apply. 'slide', 'fade', 'both' or 'none'
            transitionSpeed: 250,
            transitionEasing: 'swing', // String: 'linear', 'swing', 'default'.

            content: 'ul', //CSS selector for the element acting as main content.
            toggle: '.nav__toggle', // Selector class for the element acting as a button.
            togglePosition: 'inside', // String: Position of toggle in navigation: 'inside', 'before', 'after' or 'none'.
            toggleContent: 'Menu', // Html tags or text

            childContent: 'ul', //CSS selector for the element acting as child content.
            childToggle: '.nav__handle', //CSS selector for the element acting as a button.
            childTogglePosition: 'after', // String: Position of child toggle: 'before', 'after' or 'none'
            childToggleContent: '+', // Html tags or text
            overlay: '' // Selector class for the element acting as overlay.
        }, settings);


        this.each(function () {

            var wrapper = $(this),
                content = wrapper.find(options.content).first(),
                toggleSelector = options.toggle,
                toggleButton = '<div role="button" class="' + options.toggle.split('.').join('') + ' is-inactive" data-toggle aria-label="Navigation menu">' + options.toggleContent + '</div>',
                childContent = content.find(options.childContent),
                childToggleSelector = 'ul li [data-handle]',
                childToggleButton = '<span role="button" class="' + options.childToggle.split('.').join('') + '" data-handle tabindex="0" aria-label="Open submenu">' + options.childToggleContent + '</span>',
                overlaySelector = options.overlay;

            function initPlugin() {

                $(content).attr('data-content', '');
                $(childContent).attr('data-content', '');

                if (options.togglePosition === 'inside') {
                    $(wrapper).prepend(toggleButton);
                } else if (options.togglePosition === 'before') {
                    $(wrapper).before(toggleButton);
                } else if (options.togglePosition === 'after') {
                    $(wrapper).after(toggleButton);
                }

                childContent.parent('li').each(function () {
                    $(this).addClass('has-children');
                    if (options.childTogglePosition === 'before') {
                        $(this).children('a:first-child').before(childToggleButton);
                    } else if (options.childTogglePosition === 'after') {
                        $(this).children('a:first-child').after(childToggleButton);
                    }
                });

                if (options.overlay) {
                    $('body').append('<div role="button" class="' + options.overlay.split('.').join('') + '" data-overlay></div>');
                }
            }
            initPlugin();

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

            function resetChilds(el) {
                $(childContent).not(el).removeClass('is-open');
                if (!$(childContent).hasClass('is-open')) {
                    $(overlaySelector).removeClass('is-visible');
                    $('body').removeClass('submenu-open');
                }
            }

            function closeOverlay() {
                $(overlaySelector).click(function () {
                    if ($(this).hasClass('is-visible')) {
                        resetChilds();
                    }
                    return false;
                });
            }
            closeOverlay();



            // Toggle responsive navigation
            $(toggleSelector).click(function () {
                // Reset childContentd when open / close responsive navigation
                resetChilds();

                if ($(':visible', content).length < 1) {
                    $(toggleSelector).toggleClass('is-inactive is-active');

                    $(content).hide().toggleClass('is-open').transitions(function () {
                        $(this).removeAttr('style');
                    });
                    $('body').addClass('menu-open');

                } else {

                    $(content).stop(true, true).transitions(function () {
                        $(toggleSelector).toggleClass('is-active is-inactive');
                        $(this).toggleClass('is-open').removeAttr('style');
                    });
                    $('body').removeClass('menu-open');
                }

                return false;
            });

            $(childToggleSelector).click(function () {

                var currentTarget = $(this).parent().children('[data-content]'),
                    currentParent = $(this).parents('[data-content]');

                if ($(currentTarget).hasClass('is-open')) {
                    // Open / close same childContent
                    // and check if childContent parent is not open
                    $(this).removeClass('is-active');


                    resetChilds(currentParent);

                } else {
                    // Open different childContent, close others except in same tree
                    $(childContent).not(currentTarget && currentParent).removeClass('is-open');
                    $(childToggleSelector).not(this).removeClass('is-active');
                    $(this).addClass('is-active');
                    $(overlaySelector).addClass('is-visible');
                    $(currentTarget).addClass('is-open');
                    $('body').addClass('submenu-open');
                }
                return false;
            });
        });
    };

}(jQuery));
