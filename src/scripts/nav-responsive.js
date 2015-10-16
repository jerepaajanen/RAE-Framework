(function () {
    'use strict';

    // Simple responsive navigation with subnav
    $('.js .nav--responsive').each(function () {

        var nav = $(this),
            menu = nav.find('> ul'),
            dropdown = menu.find('li ul'),
            navToggleClass = 'nav-toggle',
            dropdownToggleClass = 'nav-item__toggle';

        // Build 'nav--responsive' elements
        nav.prepend('<a href="#" role="button" class="' + navToggleClass + ' is-inactive" title="Toggle Menu"><span class="nav-toggle__label u-visually-hidden">Menu</span><span class="nav-toggle__icon"><span class="bar"></span><span class="bar"></span><span class="bar"></span></span></a>');
        menu.addClass('is-collapsible');
        dropdown.addClass('is-collapsible');
        dropdown.parent('li').addClass('with-dropdown').prepend('<span role="button" class="' + dropdownToggleClass + '">+</span>');

        // Toggle responsive navigation
        $('.' + navToggleClass).click(function () {
            if ($(':visible', menu).length < 1) {
                $('.' + navToggleClass).toggleClass('is-inactive is-active');
                $(menu).hide().toggleClass('is-open').slideDown(300, function () {
                    $(this).removeAttr('style');
                });
            } else {
                $(menu).stop(true, true).slideUp(200, function () {
                    $('.' + navToggleClass).toggleClass('is-active is-inactive');
                    $(this).toggleClass('is-open').removeAttr('style');
                });
            }
            return false;
        });

        // Toggle dropdowns
        $(menu).on('click', '.' + dropdownToggleClass, function () {
            // Toggle the nested nav
            $(dropdown).toggleClass('is-open');
            var toggleLabel = $(dropdown).is(':visible') ? '-' : '+';
            $(this).text(toggleLabel);
            $(this).toggleClass('is-active');
        });
    });

}());
