(function () {
    'use strict';

    // Simple responsive navigation with subnav
    $('.js-responsive-nav').each(function () {

        var nav = $(this),
            navMenuClass = 'navbar__list',
            navItemClass = 'navbar-item',
            dropdownClass = 'dropdown',
            navToggleClass = 'navbar-toggle',
            dropdownToggleClass = 'dropdown-toggle',
            menu = nav.children('.' + navMenuClass),
            dropdown = menu.find('li .' + dropdownClass);

        // Build 'nav--responsive' elements
        nav.prepend('<div role="button" class="' + navToggleClass + ' is-inactive" title="Toggle Menu"><span></span><span></span><span></span><div class="u-visually-hidden">Menu</div></div>');
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
