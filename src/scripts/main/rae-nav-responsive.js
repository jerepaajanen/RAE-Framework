(function ($) {

  'use strict';

  $.fn.raeNavResponsive = function (settings) {

    var settings = $.extend({
      toggle: true, // Enable / disable Navigation toggle functionality
      toggleClass: 'nav-toggle', // Selector class for the element acting as a button.
      togglePrependTo: '', // Selector, jQuery object, or jQuery selector string to prepend the toggle button.
      toggleAppendTo: '', // Selector, jQuery object, or jQuery selector string to append the toggle button to. Takes precedence over togglePrependTo.
      toggleLabel: 'Toggle Menu',
      toggleContent: '☰', // Html or text
      transition: 'both', // String: 'slide', 'fade', 'both' or 'none'
      transitionDuration: 250,
      menuSelector: 'ul', // Selector for the element acting as main content.
      submenuSelector: 'ul', // Selector for the element acting as child content.
      submenuButtonPosition: 'after', // String: 'wrap', 'before', 'after' or 'none'
      submenuButtonClass: 'submenu-toggle', // Selector for the element acting as a button.
      submenuButtonLabel: 'Toggle Submenu',
      submenuButtonContent: '+', // Html or text
      closeOnBodyClick: true // Close Submenus on click outside navigation. If using multiple instances, set false to other

    }, settings);
    this.each(function () {

      var
        $this = $(this),
        $menu = $this.first().find(settings.menuSelector),
        $submenu = $menu.children().find(settings.submenuSelector),
        $submenuParent = $submenu.parent();


      // Set id's navigation container and toggle button

      var
        $id,
        $toggleId;

      if (typeof $this.attr('id') !== 'undefined' && $this.attr('id') !== false) {

        $id = $this.attr('id');
        $toggleId = $id + '-toggle';

      } else {

        $id = $this.attr('class').split(' ')[0];
        $toggleId = $id + '-toggle';
        $this.attr('id', $id);

      }

      // Craete toggle button for navigation

      $this.toggle = $(['<button id="' + $toggleId + '" aria-label="' + settings.toggleLabel + '" aria-haspopup="true" aria-expanded="false" aria-controls="' + $id + '" role="button" tabindex="0" class="' + settings.toggleClass + ' is-inactive">',
        settings.toggleContent,
        '<span class="u-visually-hidden">' + settings.toggleLabel + '</span>',
        '</button>'
      ].join(''));


      // Set toggle button in place
      if (settings.toggle == true && settings.toggleAppendTo !== '') {
        $(settings.toggleAppendTo).append($this.toggle);
      } else if (settings.toggle == true && settings.togglePrependTo !== '') {
        $(settings.togglePrependTo).prepend($this.toggle);
      } else if (settings.toggle == true) {
        $this.before($this.toggle);
      }

      // Set Aria-Role for main menu container
      $menu
        .attr('role', 'menu');
      $menu
        .find('a')
        .attr('role', 'menu-item')
        .attr('tabindex', '-1');

      $submenu
        .attr('aria-hidden', 'true')
        .attr('role', 'menu');

      // Add 'has-submenu' -class for styling purposes
      $submenuParent
        .addClass('has-submenu');

      // Iterate submenus and create additional structure

      $submenuParent
        .children('a').each(function () {

          var
            $id,
            $submenuId = $(this).next($submenu).attr('id');

          if (typeof $submenuId !== 'undefined' && $submenuId !== false) {

            $id = $submenuId + '-submenu';

          } else {

            $id = $(this).text().trim().replace(/\s+/g, '-').toLowerCase() + '-submenu';

          }

          var $submenuButton = '<button tabindex="0" class="' + settings.submenuButtonClass + '" aria-haspopup="true" aria-expanded="false" aria-label="' + settings.toggleLabel + '" aria-controls="' + $id + '">' + settings.submenuButtonContent + '</button>';


          $(this).next($submenu).attr('id', $id);

          if (settings.submenuButtonPosition === 'before') {

            $(this).before($submenuButton);

          } else if (settings.submenuButtonPosition === 'after') {

            $(this).after($submenuButton);

          } else if (settings.submenuButtonPosition === 'wrap') {

            var
              $wrap = $(this),
              $wrapClass = $wrap.attr('class'),
              $wrapText = $wrap.text();

            $wrap
              .replaceWith([
                '<a role="button" tabindex="0" class="' + $wrapClass + '" aria-label="' + settings.toggleLabel + '" aria-haspopup="true" aria-expanded="false" aria-controls="' + $id + '">',
                $wrapText,
                '<span class="' + settings.submenuButtonClass + '">',
                settings.submenuButtonContent,
                '</span></a>'
              ].join(''));
          }

        });

      /*===================================================
       Nav Toggle Transitions
      ===================================================*/

      $.fn.transitions = function (e) {
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

        return this.animate(transition, settings.transitionDuration, 'linear', e);

      };

      function toggleNav($current) {

        var
          $current,
          $toggleNav = $('#' + $current.attr('aria-controls'));


        if ($(':visible', $toggleNav).length < 1) {

          $('body').addClass('menu-open');
          $current
            .toggleClass('is-inactive is-active')
            .attr("aria-expanded", "true");

          $toggleNav
            .hide()
            .addClass('is-open')
            .transitions(function () {
              $(this).removeAttr('style');
            });



        } else {

          $toggleNav
            .transitions(function () {

              $current
                .toggleClass('is-active is-inactive')
                .attr("aria-expanded", "false");

              $(this)
                .removeClass('is-open')
                .removeAttr('style');
            });

          $('body').removeClass('menu-open');
        }

      }

      function toggleSubmenu($current) {

        var
          $current,
          $toggleSubmenu = $('#' + $current.attr('aria-controls')),
          $currentParents = $current.parents(settings.submenuSelector);

        if ($current.attr("aria-expanded") === "true") {
          $current.attr("aria-expanded", "false");
          $toggleSubmenu.attr('aria-hidden', "true");

          $('body').removeClass('submenu-open');

        } else {
          $submenuButton.attr("aria-expanded", "false");
          $submenu.not($currentParents).attr("aria-hidden", "true");

          $current.attr("aria-expanded", "true");
          $toggleSubmenu.attr('aria-hidden', "false");
          $('body').addClass('submenu-open');

        }

      }

      function closeAllNavs() {

        $($this)
          .removeClass('is-open')
          .removeAttr('style');

        $($this.toggle)
          .removeClass('is-active')
          .addClass('is-inactive')
          .attr("aria-expanded", "false");

        $('body').removeClass('menu-open');
      }

      function closeAllSubmenus() {

        $submenuButton.attr("aria-expanded", "false");
        $submenu.attr("aria-hidden", "true");

        $('body').removeClass('submenu-open');
      }

      /*===================================================
       Nav Open / Close Functions
      ===================================================*/

      $($this.toggle).on("click", function (e) {

        toggleNav($(this));
        closeAllSubmenus();

        return false;
      });

      /*===================================================
       Submenu Open / Close Functions
      ===================================================*/

      var $submenuButton = $submenuParent.children("[aria-expanded]");

      $submenuButton.on("click", function (e) {
        toggleSubmenu($(this));
      });

      /*===================================================
       Close Nav and Submenu on ESC key press
      ===================================================*/

      $(document).on("keyup", function (e) {
        if (e.keyCode == 27) {
          if ($('body').hasClass('submenu-open')) {
            closeAllSubmenus();
          } else {
            closeAllNavs();
          }
        }
        e.preventDefault();
      });

      /*===================================================
       Close Submenu when clicked outside of Nav
      ===================================================*/

      $(document).on("click", function (e) {
        if (settings.closeOnBodyClick === true & !$(e.target).closest($this).length) {
          closeAllSubmenus();
        }
      });

    });
  };

}(jQuery));
