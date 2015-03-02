/*jslint browser: true*/
/*global $, jQuery, alert*/

(function () {
    'use strict';
    /* DOCUMENT READY BEGIN */

    // Simple responsive nav with subnav that works via css conditional styles
    $('.js .nav-responsive').each(function () {
        
        var nav = $(this),
            menu =                  nav.find('> ul'),
            submenu =               nav.find('ul ul'),
            navToggleClass =        'nav-toggle',
            submenuToggleClass =    'submenu-toggle',
            screenSize =            'sm'; //sm=small, md=medium, lg=large, xl=xlarge
        
        // Build responsive nav components
        nav.prepend('<a role="button" href="#" class="' + navToggleClass + ' show-' + screenSize + '-down">Menu</a>');
        menu.addClass('hide-' + screenSize + '-down');
        submenu.addClass('hide-' + screenSize + '-down');
        
        // Add a <span> to every .nav-item that has a <ul> inside
        submenu.parent().prepend('<a role="button" href="#" class="' + submenuToggleClass + ' show-' + screenSize + '-down">+</a>');
        
        // Toggle Mobile nav
        $('.' + navToggleClass).click(function () {
            if ($(':visible', menu).length < 1) {
                $(menu).hide().removeClass('hide-' + screenSize + '-down').slideDown(300, function () {
                    $('.' + navToggleClass).toggleClass('active');
                    $(this).removeAttr('style');
                });
            } else {
                $(menu).stop(true, true).slideUp(200, function () {
                    $('.' + navToggleClass).toggleClass('active');
                    $(this).addClass('hide-' + screenSize + '-down').removeAttr('style');
                });
            }
            return false;
        });
        
        // Dynamic binding to on 'click'
        $(menu).on('click', '.' + submenuToggleClass, function () {
            // Toggle the nested nav
            $(this).siblings(submenu).toggleClass('show hide-' + screenSize + '-down');
            var txt = $(submenu).is(':visible') ? '-' : '+';
            $(this).text(txt);
            // Toggle the arrow using CSS3 transforms
            $(this).toggleClass('active');
        });
    });


    /* DOCUMENT READY END === */
}());