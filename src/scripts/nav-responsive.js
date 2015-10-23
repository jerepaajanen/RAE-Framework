(function () {
    'use strict';

    // Simple responsive navigation with subnav
    $('.nav--responsive').each(function () {

        var nav = $(this),
            navMenuClass = 'nav__list',
            navItemClass = 'nav-item',
            dropdownClass = 'dropdown',
            navToggleClass = 'nav-toggle',
            dropdownToggleClass = 'dropdown-toggle',
            menu = nav.children('.' + navMenuClass),
            dropdown = menu.find('li .' + dropdownClass);

        // Build 'nav--responsive' elements
        nav.prepend('<div role="button" class="' + navToggleClass + ' is-inactive" title="Toggle Menu"><span class="nav-toggle__label u-visually-hidden">Menu</span><span class="nav-toggle__icon"><span class="bar"></span><span class="bar"></span><span class="bar"></span></span></div>');
        menu.addClass('is-collapsible');
        dropdown.addClass('is-collapsible');
        dropdown.parent('li').addClass(navItemClass + '--with-' + dropdownClass).prepend('<span role="button" class="' + dropdownToggleClass + '">+</span>');

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
        $('.' + dropdownToggleClass).click(function () {

            var toggleLabel = $(this).parent().children('.' + dropdownClass).is(':visible') ? '+' : '-';

            $(this).toggleClass('is-active');
            $(this).parent().children('.' + dropdownClass).toggleClass('is-open');
            $(this).text(toggleLabel);

            return false;
        });
    });

}());
