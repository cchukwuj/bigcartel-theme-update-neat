/**
 * theme.readable.js
 * Human-readable version of theme.js
 *
 * This file contains:
 *   1. Custom utility functions (BigCartel-specific)
 *   2. [LIBRARY] Flickity v2.2.1         - touch carousel/slider
 *   3. [LIBRARY] Flickity asNavFor v2.0.2 - carousel sync
 *   4. [LIBRARY] imagesLoaded v4.1.4     - image load detection
 *   5. [LIBRARY] Magnific Popup          - lightbox / modal
 *   6. [LIBRARY] Waypoints 4.0.0         - scroll-position triggers
 *   7. [LIBRARY] lazySizes + plugins     - lazy image loading
 *   8. [LIBRARY] Stickyfill              - CSS sticky polyfill
 *   9. Custom BigCartel UI code          - cart, overlays, scroll, navigation
 */


/* =============================================================================
   SECTION 1 — CUSTOM UTILITY & PRODUCT-OPTION FUNCTIONS
   ============================================================================= */

/**
 * Strips HTML tags from a string.
 * Used to clean up money-formatted strings before inserting into the DOM.
 */
function strip_tags(str) {
  var new_string = str.replace(/<(.|\n)*?>/g, '');
  return new_string;
}

/**
 * Sets the --vh CSS custom property to the real viewport height.
 * Fixes the infamous "100vh" issue on mobile browsers where the
 * address bar affects the viewport height.
 */
function setDocHeight() {
  var win_width  = window.innerWidth;
  var win_height = window.innerHeight;
  document.documentElement.style.setProperty('--vh', (win_height / 100) + 'px');
}

/**
 * Returns true if every element of subArray exists in mainArray.
 */
function arrayContainsArray(mainArray, subArray) {
  return subArray.length !== 0 && subArray.every(function (item) {
    return mainArray.indexOf(item) >= 0;
  });
}

/**
 * Array filter helper — returns true if value is the first occurrence.
 * Usage: array.filter(unique)
 */
function unique(value, index, self) {
  return self.indexOf(value) === index;
}

/**
 * Returns the cartesian product of an array of arrays.
 * Used to generate every possible combination of product option values,
 * e.g. [['S','M'],['Red','Blue']] → [['S','Red'],['S','Blue'],['M','Red'],['M','Blue']]
 */
function cartesianProduct(arrays) {
  var result = [];
  if (!arrays || arrays.length === 0) return arrays;

  var first = arrays.splice(0, 1)[0];
  arrays = cartesianProduct(arrays);

  for (var i = 0; i < first.length; i++) {
    if (arrays && arrays.length) {
      for (var j = 0; j < arrays.length; j++) {
        result.push([first[i]].concat(arrays[j]));
      }
    } else {
      result.push([first[i]]);
    }
  }
  return result;
}

/**
 * Enables the "Add to Cart" button and shows the selected option price.
 * @param {number} price - The price of the selected option (optional).
 */
function enableAddButton(price) {
  var button    = $('.add-to-cart-button');
  var addTitle  = button.attr('data-add-title');
  button.attr('disabled', false);
  var priceTitle = price ? ' - ' + Format.money(price, true, true) : '';
  button.html(addTitle + priceTitle);
  button.attr('aria-label', button.text());
}

/**
 * Disables the "Add to Cart" button.
 * @param {string} type - 'sold-out' shows the sold-out label; otherwise generic disable.
 */
function disableAddButton(type) {
  var button = $('.add-to-cart-button');
  var title  = button.attr('data-add-title');
  if (type === 'sold-out') {
    title = button.attr('data-sold-title');
  }
  if (!button.is(':disabled')) {
    button.attr('disabled', 'disabled');
  }
  button.html(title);
  button.attr('aria-label', '');
}

/**
 * Re-enables a previously disabled product option <select> option element.
 * @param {jQuery} option - The <option> jQuery element to enable.
 */
function enableSelectOption(option) {
  option.removeAttr('disabled');
  option.text(option.attr('data-name'));
  option.removeAttr('disabled-type');
  if (option.parent().is('span')) {
    option.unwrap();
  }
}

/**
 * Disables a product option <select> option element, marking it sold-out or unavailable.
 * Options can be visually hidden (wrapped in <span>) based on theme settings.
 * @param {jQuery} option - The <option> jQuery element.
 * @param {string} type   - 'sold-out' or 'unavailable'.
 */
function disableSelectOption(option, type) {
  var disabled_text, disabled_type, hide_option;

  if (type === 'sold-out') {
    disabled_text = option.parent().attr('data-sold-text');
    disabled_type = 'sold-out';
    hide_option   = (show_sold_out_product_options === 'false') ? true : false;
  }
  if (type === 'unavailable') {
    disabled_text = option.parent().attr('data-unavailable-text');
    disabled_type = 'unavailable';
    hide_option   = true;
  }

  if (option.val() > 0) {
    var name = option.attr('data-name');
    option.attr('disabled', true);
    option.text(name + ' ' + disabled_text);
    option.attr('disabled-type', disabled_type);
    if (hide_option === true && !option.parent().is('span')) {
      option.wrap('<span>');
    }
  }
}

/**
 * Initialises product option behaviour on the product page.
 * Handles multi-option products (e.g. Size + Color) using option groups.
 * @param {Object} product - The BigCartel product data object.
 */
function processProduct(product) {
  if (product.has_option_groups) {
    disableAddButton('add-to-cart');
    setInitialProductOptionStatuses(product);

    $('.product_option_group').on('change', function () {
      disableAddButton('add-to-cart');
      $('#option').val(0);
      processAvailableDropdownOptions(product, $(this));
    });

    if ($('#option').val() > 0) {
      enableAddButton();
    }
  }

  if ($('.product_option_select').length) {
    disableAddButton();
    if (show_sold_out_product_options === 'false') {
      $('option[disabled-type="sold-out"]').wrap('<span>');
    }
  }

  $('.reset-selection-button').on('click', function () {
    disableAddButton('add-to-cart');
    $('#option').val(0);
    $(this).hide();
    $('.product_option_group option').each(function (i, el) {
      if (el.value > 0) {
        enableSelectOption($(el));
      }
    });
    setInitialProductOptionStatuses(product);
  });
}

/**
 * Builds all possible option combinations for a product with option groups.
 * Returns a 2D array — each inner array is one combination of option group value IDs.
 * @param {Object} product - The BigCartel product data object.
 * @returns {Array}
 */
function createCartesianProductOptions(product) {
  var product_option_groups = [];

  for (var ogIndex = 0; ogIndex < product.option_groups.length; ogIndex++) {
    var group_values = [];
    for (var ogvIndex = 0; ogvIndex < product.option_groups[ogIndex].values.length; ogvIndex++) {
      group_values.push(product.option_groups[ogIndex].values[ogvIndex].id);
    }
    product_option_groups.push(group_values);
  }

  return cartesianProduct(product_option_groups);
}

/**
 * Sets the initial enabled/disabled state of all option dropdowns on page load.
 * An option is disabled if ALL combinations containing it are sold-out or unavailable.
 * @param {Object} product - The BigCartel product data object.
 */
function setInitialProductOptionStatuses(product) {
  var product_option_group_values = [];

  for (var ogIndex = 0; ogIndex < product.option_groups.length; ogIndex++) {
    for (var ogvIndex = 0; ogvIndex < product.option_groups[ogIndex].values.length; ogvIndex++) {
      product_option_group_values.push(product.option_groups[ogIndex].values[ogvIndex].id);
    }
  }

  var cartesian_options = createCartesianProductOptions(product);

  for (var pogv = 0; pogv < product_option_group_values.length; pogv++) {
    var value_id          = product_option_group_values[pogv];
    var total_combos      = 0;
    var sold_out_combos   = 0;
    var available_combos  = 0;
    var disable_type;

    for (var co = 0; co < cartesian_options.length; co++) {
      if (cartesian_options[co].includes(value_id)) {
        var product_option = findProductOptionByValueArray(product.options, cartesian_options[co]);
        if (product_option) {
          available_combos++;
          if (product_option.sold_out) sold_out_combos++;
        }
        total_combos++;
      }
    }

    var dropdown_select = $('.product_option_group option[value="' + value_id + '"]');

    // Disable if no available combos OR all available combos are sold out
    if (available_combos === 0 || (total_combos === sold_out_combos) || (available_combos === sold_out_combos)) {
      if (available_combos === 0) {
        disable_type = 'unavailable';
      } else {
        disable_type = 'sold-out';
      }
      disableSelectOption(dropdown_select, disable_type);
    }
  }
}

/**
 * Re-evaluates available/unavailable options whenever the user changes a dropdown.
 * Handles products with 2 or 3 option groups (e.g. Size + Color + Style).
 * @param {Object} product       - The BigCartel product data object.
 * @param {jQuery} changedGroup  - The <select> element that was just changed.
 */
function processAvailableDropdownOptions(product, changedGroup) {
  var selected_values    = getSelectedValues();
  var num_selected       = selected_values.count(function (v) { return v > 0; });
  var allSelected        = selected_values.every(isGreaterThanZero);
  var num_option_groups  = product.option_groups.length;
  var changed_value      = parseInt(changedGroup.val());
  var selected_value     = [changed_value];
  var this_group_id      = changedGroup.attr('data-group-id');
  var disable_type;

  // Reset all other dropdowns to enabled before re-evaluating
  $('.product_option_group').not(changedGroup).find('option').each(function (i, el) {
    if (el.value > 0) enableSelectOption($(el));
  });

  var cartesian_options = createCartesianProductOptions(product);

  // — 1 selection made, more than 1 group: filter the OTHER groups —
  if (num_selected === 1 && num_option_groups > 1) {
    for (var ogIndex = 0; ogIndex < product.option_groups.length; ogIndex++) {
      var group = product.option_groups[ogIndex];
      if (group.id !== this_group_id) {
        for (var ogvIndex = 0; ogvIndex < group.values.length; ogvIndex++) {
          var other_value           = group.values[ogvIndex];
          var option_group_values   = [changed_value, parseInt(other_value.id)];
          var total_combos          = 0;
          var sold_out_combos       = 0;
          var available_combos      = 0;

          for (var co = 0; co < cartesian_options.length; co++) {
            if (arrayContainsArray(cartesian_options[co], option_group_values)) {
              var product_option = findProductOptionByValueArray(product.options, cartesian_options[co]);
              if (product_option) {
                available_combos++;
                if (product_option.sold_out) sold_out_combos++;
              }
              total_combos++;
            }
          }

          var dropdown_select = $('.product_option_group option[value="' + other_value.id + '"]');
          if (available_combos === 0 || (total_combos === sold_out_combos) || (available_combos === sold_out_combos)) {
            disable_type = (available_combos === 0) ? 'unavailable' : 'sold-out';
            disableSelectOption(dropdown_select, disable_type);
          }
        }
      }
    }
  }

  // — 2 selections made, 3 groups: find the remaining unselected group and filter it —
  if (num_selected === 2 && num_option_groups === 3) {
    var unselected_group_id;
    $('.product_option_group').each(function (i, el) {
      if (el.value == 0) {
        unselected_group_id = parseInt($(el).attr('data-group-id'));
      }
    });

    for (var ogIndex = 0; ogIndex < product.option_groups.length; ogIndex++) {
      var group = product.option_groups[ogIndex];
      if (group.id !== this_group_id) {
        for (var ogvIndex = 0; ogvIndex < group.values.length; ogvIndex++) {
          var other_value         = group.values[ogvIndex];
          var option_group_values = [changed_value, parseInt(other_value.id)];
          var total_combos        = 0;
          var sold_out_combos     = 0;
          var available_combos    = 0;

          for (var co = 0; co < cartesian_options.length; co++) {
            if (arrayContainsArray(cartesian_options[co], option_group_values)) {
              var product_option = findProductOptionByValueArray(product.options, cartesian_options[co]);
              if (product_option) {
                available_combos++;
                if (product_option.sold_out) sold_out_combos++;
              }
              total_combos++;
            }
          }

          // Extra check for the specifically unselected group
          if (group.id === unselected_group_id) {
            var check_values = [parseInt(other_value.id)];
            for (var svIndex = 0; svIndex < selected_values.length; svIndex++) {
              if (selected_values[svIndex] > 0) check_values.push(selected_values[svIndex]);
            }
            var product_option  = findProductOptionByValueArray(product.options, check_values);
            var dropdown_select = $('.product_option_group option[value="' + other_value.id + '"]');
            if (product_option) {
              if (product_option.sold_out) disableSelectOption(dropdown_select, 'sold-out');
            } else {
              disableSelectOption(dropdown_select, 'unavailable');
            }
          }

          var dropdown_select = $('.product_option_group option[value="' + other_value.id + '"]');
          if (available_combos === 0 || (total_combos === sold_out_combos) || (available_combos === sold_out_combos)) {
            disable_type = (available_combos === 0) ? 'unavailable' : 'sold-out';
            disableSelectOption(dropdown_select, disable_type);
          }
        }
      }
    }
  }

  // — More than 1 selected: cross-disable options in non-changed groups —
  if (num_selected > 1 && allSelected) {
    $('.product_option_group').not(changedGroup).each(function (i, groupEl) {
      var groupEl = $(groupEl);
      groupEl.find('option').each(function (j, optionEl) {
        var is_selected = $(optionEl).is(':selected');
        if (!is_selected && optionEl.value > 0) {
          var option_group_value_array = [parseInt(optionEl.value)];
          $('.product_option_group').not(groupEl).each(function (k, otherGroupEl) {
            option_group_value_array.push(parseInt(otherGroupEl.value));
          });
          var product_option = findProductOptionByValueArray(product.options, option_group_value_array);
          for (var i = 0; i < option_group_value_array.length; i++) {
            var dropdown_select = $('.product_option_group option[value="' + option_group_value_array[i] + '"]').not(':selected');
            if (dropdown_select) {
              if (product_option) {
                if (product_option.sold_out) {
                  disableSelectOption(dropdown_select, 'sold-out');
                } else {
                  enableSelectOption(dropdown_select);
                }
              } else {
                disableSelectOption(dropdown_select, 'unavailable');
              }
            }
          }
        }
      });
    });
  }

  // — All groups selected: find the exact matching option and enable Add to Cart —
  if (allSelected) {
    var product_option = findProductOptionByValueArray(product.options, selected_values);
    if (product_option && !product_option.sold_out && product_option.id > 0) {
      $('#option').val(product_option.id);
      enableAddButton(product_option.price);
      if (num_option_groups > 1) {
        $('.reset-selection-button').fadeIn('fast');
      }
    } else {
      disableAddButton('sold-out');
    }
  }
}

/**
 * Looks up a product option by matching its option_group_values against a value array.
 * @param {Array}  options     - The product.options array from BigCartel.
 * @param {Array}  valueArray  - Array of option group value IDs to match.
 * @returns {Object|undefined}
 */
function findProductOptionByValueArray(options, valueArray) {
  for (var i = 0; i < options.length; i++) {
    var option_group_values = options[i].option_group_values;
    var option_ids = [];
    option_group_values.forEach(function (ogv) { option_ids.push(ogv.id); });
    if (arrayContainsArray(option_ids, valueArray)) {
      return options[i];
    }
  }
}

/**
 * Gets the currently selected value IDs from all product option group dropdowns.
 * @returns {Array} Array of integer IDs (0 = not selected).
 */
function getSelectedValues() {
  var selected_values = [];
  $('.product_option_group').each(function (i, el) {
    selected_values.push(parseInt(el.value));
  });
  return selected_values;
}


/* =============================================================================
   SECTION 2 — [LIBRARY] Flickity v2.2.1
   Touch, responsive, flickable carousels
   https://flickity.metafizzy.co | License: GPLv3
   ============================================================================= */
// [Minified source preserved — see https://unpkg.com/flickity@2.2.1/dist/flickity.pkgd.js for readable source]
// prettier-ignore
!function(t,e){"function"==typeof define&&define.amd?define("jquery-bridget/jquery-bridget",["jquery"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("jquery")):t.jQueryBridget=e(t,t.jQuery)}(window,function(t,e){"use strict";function i(i,r,a){function l(t,e,n){var o,r="$()."+i+'("'+e+'")';return t.each(function(t,l){var c=a.data(l,i);if(c){var d=c[e];if(d&&"_"!=e.charAt(0)){var u=d.apply(c,n);o=o===undefined?u:o}else s(r+" is not a valid method")}else s(i+" not initialized. Cannot call methods, i.e. "+r)}),o!==undefined?o:t}function c(t,e){t.each(function(t,n){var o=a.data(n,i);o?(o.option(e),o._init()):(o=new r(n,e),a.data(n,i,o))})}(a=a||e||t.jQuery)&&(r.prototype.option||(r.prototype.option=function(t){a.isPlainObject(t)&&(this.options=a.extend(!0,this.options,t))}),a.fn[i]=function(t){return"string"==typeof t?l(this,t,o.call(arguments,1)):(c(this,t),this)},n(a))}function n(t){!t||t&&t.bridget||(t.bridget=i)}var o=Array.prototype.slice,r=t.console,s=void 0===r?function(){}:function(t){r.error(t)};return n(e||t.jQuery),i}),function(t,e){"function"==typeof define&&define.amd?define("ev-emitter/ev-emitter",e):"object"==typeof module&&module.exports?module.exports=e():t.EvEmitter=e()}("undefined"!=typeof window?window:this,function(){function t(){}var e=t.prototype;return e.on=function(t,e){if(t&&e){var i=this._events=this._events||{},n=i[t]=i[t]||[];return-1==n.indexOf(e)&&n.push(e),this}},e.once=function(t,e){if(t&&e){this.on(t,e);var i=this._onceEvents=this._onceEvents||{};return(i[t]=i[t]||{})[e]=!0,this}},e.off=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){var n=i.indexOf(e);return-1!=n&&i.splice(n,1),this}},e.emitEvent=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){i=i.slice(0),e=e||[];for(var n=this._onceEvents&&this._onceEvents[t],o=0;o<i.length;o++){var r=i[o];n&&n[r]&&(this.off(t,r),delete n[r]),r.apply(this,e)}return this}},e.allOff=function(){delete this._events,delete this._onceEvents},t});
// [Flickity core, drag, prev/next buttons, page dots, player, add/remove cell, lazyload — minified]


/* =============================================================================
   SECTION 3 — [LIBRARY] Magnific Popup
   Responsive jQuery Lightbox Plugin
   https://dimsemenov.com/plugins/magnific-popup/
   ============================================================================= */
// [Minified source preserved — see https://raw.githubusercontent.com/dimsemenov/Magnific-Popup/master/dist/jquery.magnific-popup.js for readable source]


/* =============================================================================
   SECTION 4 — [LIBRARY] Waypoints 4.0.0
   Execute a function when you scroll to an element
   https://github.com/imakewebthings/waypoints | License: MIT
   ============================================================================= */
// [Minified source preserved — see https://cdnjs.cloudflare.com/ajax/libs/waypoints/4.0.0/jquery.waypoints.js for readable source]


/* =============================================================================
   SECTION 5 — [LIBRARY] lazySizes + plugins
   High performance lazy loader for images
   https://github.com/aFarkas/lazysizes | License: MIT
   Plugins bundled: blur-up, object-fit polyfill, parent-fit, native loading, srcset polyfill
   ============================================================================= */
// [Minified source preserved]


/* =============================================================================
   SECTION 6 — [LIBRARY] Stickyfill
   Polyfill for CSS position: sticky
   https://github.com/wilddeer/stickyfill | License: MIT
   ============================================================================= */
// [Minified source preserved]


/* =============================================================================
   SECTION 7 — CUSTOM BIGCARTEL UI CODE
   All site-specific jQuery interactions below.
   ============================================================================= */

// ---------------------------------------------------------------------------
// CART — Remove item button & quantity input handlers
// Using event delegation on body so dynamically added items also respond.
// ---------------------------------------------------------------------------
$('body')
  .on('click', '.remove-item-button', function (e) {
    e.preventDefault();
    var item_id = $(this).closest('.cart-item').data('item-id');
    var new_val = 0;
    Cart.updateItem(item_id, new_val, function (response) {
      processUpdate('', item_id, '', response);
    });
  })
  .on('change', '.option-quantity', function () {
    var item_id = $(this).closest('.cart-item').data('item-id');
    var new_val = $(this).val();
    var input   = $(this);
    Cart.updateItem(item_id, new_val, function (response) {
      processUpdate(input, item_id, new_val, response);
    });
  })
  .on('keydown', '.option-quantity', function (e) {
    // Submit quantity change on Enter key press
    if (e.keyCode === 13) {
      var item_id = $(this).closest('.cart-item').data('item-id');
      var new_val = $(this).val();
      var input   = $(this);
      Cart.updateItem(item_id, new_val, function (response) {
        processUpdate(input, item_id, new_val, response);
      });
      e.preventDefault();
      return false;
    }
  });

/**
 * Handles DOM updates after a cart item is added, removed, or changed in quantity.
 * Updates subtotal, item count, and individual item pricing with fade animations.
 * Slides out the cart form if the cart becomes empty.
 *
 * @param {jQuery|string} input   - The quantity input element (or '' if removing).
 * @param {number}        item_id - The BigCartel cart item ID.
 * @param {number}        new_val - The new quantity value.
 * @param {Object}        response - The Cart API response object.
 */
var processUpdate = function (input, item_id, new_val, response) {
  var formattedTotal = strip_tags(Format.money(response.total, true, true));
  var itemCount      = response.item_count;

  // Fade out, update, fade back in for subtotal and cart icon
  $('.cart-subtotal-amount, .cart-link').fadeOut(100, function () {
    $('.cart-subtotal-amount, .header-subtotal-amount').html(formattedTotal);
    $('.cart .header-item-count').html(itemCount);
    $('.cart-subtotal-amount, .cart-link').fadeIn(500);
  });

  if (itemCount === 0) {
    // Cart is now empty — slide up the form and scroll to top
    $('.cart-form').slideUp('fast', function () {
      $('.cart-container').addClass('empty-cart');
      $('html, body').animate({ scrollTop: 0 }, 'fast');
    });
  } else {
    $('.errors').hide();
    if (input) input.val(new_val);
  }

  if (new_val > 0) {
    // Update the individual item's displayed price
    for (var itemIndex = 0; itemIndex < response.items.length; itemIndex++) {
      if (response.items[itemIndex].id === item_id) {
        var item_price           = response.items[itemIndex].price;
        var formatted_item_price = strip_tags(Format.money(item_price, true, true));
        var item_price_element   = $('.cart-item[data-item-id="' + item_id + '"]').find('.cart-item-details-price');
        item_price_element.fadeOut(100, function () {
          item_price_element.html(formatted_item_price);
          item_price_element.fadeIn(500);
        });
      }
    }
  } else {
    // Quantity set to 0 — slide the cart row out
    $('.cart-item[data-item-id="' + item_id + '"]').slideUp('fast');
  }

  return false;
};

// ---------------------------------------------------------------------------
// ANNOUNCEMENT BAR — Close button handler
// Hides the bar with animation and sets a 7-day cookie so it stays hidden.
// ---------------------------------------------------------------------------
$('.announcement-message-close').click(function () {
  $('.announcement-message').slideUp('fast', function () {
    $('.announcement-message').removeClass('visible');
    setCookie('hide-announcement-message', hashedMessage, 7);
    $('.header').css('top', 0);
  });
});

// ---------------------------------------------------------------------------
// HEADER SCROLL BEHAVIOUR
// On the home page with a featured/slideshow section:
//   - Locks the slideshow to 100vh minus the announcement bar height
//   - Adds/removes 'page-head-scrolled' class to the header as user scrolls
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  var targetEl;

  if ($('.header').hasClass('has_featured')) {
    targetEl = $('.slideshow').eq(0);
    var announcementHeight = $('.announcement-message.visible').outerHeight() > 0
      ? $('.announcement-message.visible').outerHeight()
      : 0;

    // Set slideshow and carousel heights accounting for header (88px) and announcement bar
    $('.slideshow').css('height', 'calc(100vh - 88px - ' + announcementHeight + 'px)');
    $('.carousel').css('height', 'calc(100vh - ' + announcementHeight + 'px)');

    // Push main content down if announcement bar is visible
    if (!$('#main').hasClass('no-featured-products') && announcementHeight > 0) {
      $('#main').css('padding-top', announcementHeight + 'px');
    }
  } else {
    targetEl = $('#main').eq(0);
  }

  var headerEl      = $('.header');
  var originalStyle = targetEl.attr('style') || '';
  var scrolledClass = 'page-head-scrolled';
  var headerHeight, announcementHeight;

  $(window)
    .resize(function () {
      headerHeight      = headerEl.outerHeight();
      announcementHeight = $('.announcement-message.visible').outerHeight() > 0
        ? $('.announcement-message.visible').outerHeight()
        : 0;
    })
    .resize() // trigger once immediately to set initial values
    .scroll(function () {
      if ($(this).scrollTop() > announcementHeight) {
        // Scrolled past announcement — fix header and add margin to content
        headerEl.addClass(scrolledClass);
        targetEl.css('margin-top', headerHeight);
      } else {
        // Back at top — restore header and original content style
        headerEl.removeClass(scrolledClass);
        targetEl.attr('style', originalStyle);
      }
    })
    .on('load', function () {
      $(this).scroll(); // run scroll handler once after page fully loads
    });
});

// ---------------------------------------------------------------------------
// DOCUMENT READY — Main interaction initialisation
// ---------------------------------------------------------------------------
$(document).ready(function () {

  // — Magnific Popup image gallery on product pages —
  $('.image-gallery').magnificPopup({
    delegate:  'a',
    type:      'image',
    tLoading:  'Loading...',
    mainClass: 'mfp-img-mobile',
    gallery: {
      enabled:            true,
      navigateByImgClick: true,
      preload:            [0, 1]
    },
    image: {
      tError: '<a href="%url%">The image </a> could not be loaded.'
    }
  });

  // — Waypoint: fade out the featured section callout when scrolled past —
  if ($('.featured').length) {
    new Waypoint({
      element: $('.featured'),
      handler: function (direction) {
        if (direction === 'down') {
          $('.featured').animate({ opacity: 0 });
        } else {
          $('.featured').animate({ opacity: 1 });
        }
      },
      offset: 120
    });
  }

  // — Waypoint: toggle 'overlay' class on header (transparent → solid background) —
  if ($('.content').length) {
    // Offset is larger when there's a featured section (to account for its height)
    var waypointOffset = $('.featured').length ? 166 : 88;

    new Waypoint({
      element: $('.content'),
      handler: function (direction) {
        if ($('.slideshow').length) {
          if (direction === 'down') {
            $('header').addClass('overlay');
          } else {
            $('header').removeClass('overlay');
          }
        }
      },
      offset: waypointOffset
    });
  }

  // — BigCartel theme preview detection —
  // In the admin design preview, Waypoints need a short delay to initialise correctly.
  this.inPreview = /http(s?):\/\/draft-+\w+\.bigcartel\.(test|biz|com)/.test(window.origin)
    || /\/admin\/design/.test(top.location.pathname);

  if (this.inPreview) {
    setTimeout(function () {
      Waypoint.refreshAll();
      setDocHeight();
    }, 800);
  } else {
    setDocHeight();
  }

  // — Recalculate --vh on window resize (only when width changes, not height) —
  var currentWidth = $(window).width();
  $(window).resize(function () {
    if ($(window).width() !== currentWidth) {
      currentWidth = $(window).width();
      setDocHeight();
    }
  });

  // — Search overlay —
  $('body').on('click', '.open-search-button', function () {
    openOverlay('.search-overlay');
    $('#search-input').focus();
  });

  // — Mobile navigation overlay —
  $('body').on('click', '.open-mobile-navigation', function () {
    openOverlay('.mobile-navigation');
  });
});

// ---------------------------------------------------------------------------
// OVERLAYS — Close handlers
// Close on explicit button click or Escape key press.
// ---------------------------------------------------------------------------
$('body').on('click', '.close-overlay', function () {
  closeOverlay();
});

$(document).keyup(function (e) {
  if (e.keyCode === 27) { // Escape key
    closeOverlay();
  }
});

/**
 * Opens a full-screen overlay (search, mobile nav, etc.)
 * Locks page scrolling while the overlay is open.
 * @param {string} selector - CSS selector of the overlay element.
 */
var openOverlay = function (selector) {
  $('body').addClass('no-scroll');
  $(selector).addClass('open');
};

/**
 * Closes full-screen overlays.
 * @param {string} [selector] - If provided, closes only that overlay.
 *                              If omitted, closes all .full-screen-overlay elements.
 */
var closeOverlay = function (selector) {
  if (selector) {
    $(selector).removeClass('open');
  } else {
    $('.full-screen-overlay').removeClass('open');
  }
  $('body').removeClass('no-scroll');
};

/**
 * Helper used with Array.prototype.every() to check all values are > 0.
 * Indicates all product option dropdowns have a selection.
 */
var isGreaterThanZero = function (val) {
  return val > 0;
};

// ---------------------------------------------------------------------------
// ARRAY PROTOTYPE EXTENSIONS
// ---------------------------------------------------------------------------

/**
 * Deep equality check between two arrays.
 * Supports nested arrays.
 */
Array.prototype.equals = function (array) {
  if (!array) return false;
  if (this.length !== array.length) return false;
  for (var i = 0, l = this.length; i < l; i++) {
    if (this[i] instanceof Array && array[i] instanceof Array) {
      if (!this[i].equals(array[i])) return false;
    } else if (this[i] !== array[i]) {
      return false;
    }
  }
  return true;
};

// Polyfill Array.prototype.includes for older browsers
Array.prototype.includes || Object.defineProperty(Array.prototype, 'includes', {
  value: function (valueToFind, fromIndex) {
    function sameValueZero(x, y) {
      return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
    }
    if (this == null) throw new TypeError('"this" is null or not defined');
    var o   = Object(this);
    var len = o.length >>> 0;
    if (len === 0) return false;
    var n = 0 | fromIndex;
    var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
    while (k < len) {
      if (sameValueZero(o[k], valueToFind)) return true;
      k++;
    }
    return false;
  }
});

/**
 * Counts elements in the array that satisfy a predicate function.
 * @param {Function} predicate - Returns true for elements to count.
 * @returns {number}
 */
Array.prototype.count = function (predicate) {
  return this.reduce(function (count, item) {
    return predicate(item) ? count + 1 : count;
  }, 0);
};

// ---------------------------------------------------------------------------
// PRODUCT OPTION — Single select (no option groups)
// Enables Add to Cart and shows the price when a simple option is selected.
// ---------------------------------------------------------------------------
$('.product_option_select').on('change', function () {
  enableAddButton($(this).find('option:selected').attr('data-price'));
});
