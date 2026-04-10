/**
 * Product Option Toggle Override
 * 
 * This script only runs for product names defined in PRODUCT_CONFIG.
 * Each product can have its own option labels, trigger terms, and optional image swapping.
 * 
 * Configuration:
 * - PRODUCT_CONFIG: list product names and their option labels
 * - triggerTerms: optional array of terms to search for in product description
 * - swapImages: enable image swapping for that product
 * - secondImageOffset: which image to show when toggle is ON (1 = second image)
 */

(function() {
  // ===== CONFIGURATION =====
  const PRODUCT_CONFIG = {
    '[TEST v2] Adding from big': {
      optionLabels: ['Oversized', 'Traditional'],
      triggerTerms: ['START DESCRIPTION'],
      swapImages: true,
      secondImageOffset: 1
    },
    'Product B': {
      optionLabels: ['Light', 'Dark'],
      triggerTerms: ['START DESCRIPTION'],
      swapImages: true,
      secondImageOffset: 1
    }
  };

  // ===== UTILITY FUNCTIONS =====
  function getProductName() {
    console.log('🔍 [getProductName] Starting product name detection...');
    const titleEl = document.querySelector('.product-container h1') || document.querySelector('h1');
    console.log('🔍 [getProductName] titleEl found:', titleEl);
    if (titleEl && titleEl.innerText) {
      const name = titleEl.innerText.trim();
      console.log('✅ [getProductName] Found product name from h1:', name);
      return name;
    }
    if (document.title) {
      const name = document.title.split('|')[0].trim();
      console.log('✅ [getProductName] Found product name from document.title:', name);
      return name;
    }
    console.log('❌ [getProductName] No product name found');
    return null;
  }

  function getProductConfig() {
    console.log('🔍 [getProductConfig] Checking product config...');
    const productName = getProductName();
    console.log('🔍 [getProductConfig] Product name:', productName);
    console.log('🔍 [getProductConfig] Available configs:', Object.keys(PRODUCT_CONFIG));
    if (!productName) {
      console.log('❌ [getProductConfig] No product name found');
      return null;
    }
    const config = PRODUCT_CONFIG[productName];
    console.log('🔍 [getProductConfig] Config for "' + productName + '":', config);
    return config || null;
  }

  function getActiveConfig() {
    return getProductConfig();
  }

  function getOptionLabels() {
    console.log('🔍 [getOptionLabels] Getting option labels...');
    const config = getActiveConfig();
    console.log('🔍 [getOptionLabels] Config:', config);
    if (!config || !Array.isArray(config.optionLabels) || config.optionLabels.length < 2) {
      console.log('❌ [getOptionLabels] Invalid config or optionLabels');
      return null;
    }
    const labels = {
      off: config.optionLabels[0],
      on: config.optionLabels[1]
    };
    console.log('✅ [getOptionLabels] Labels:', labels);
    return labels;
  }

  function getProductDescriptionText() {
    console.log('🔍 [getProductDescriptionText] Looking for .product-description...');
    const descriptionEl = document.querySelector('.product-description');
    console.log('🔍 [getProductDescriptionText] Description element found:', !!descriptionEl);
    if (!descriptionEl) {
      console.log('❌ [getProductDescriptionText] No .product-description element found');
      return '';
    }
    const text = descriptionEl.innerText.trim().toUpperCase();
    console.log('✅ [getProductDescriptionText] Description text (first 200 chars):', text.substring(0, 200));
    return text;
  }

  /**
   * Check whether this product should show the toggle.
   * If triggerTerms are defined, the description must contain at least one.
   * If triggerTerms are not defined, the product is shown whenever it is listed in PRODUCT_CONFIG.
   */
  function shouldShowToggle() {
    console.log('🔍 [shouldShowToggle] Checking if toggle should show...');
    const config = getActiveConfig();
    if (!config) {
      console.log('❌ [shouldShowToggle] No config found - returning false');
      return false;
    }

    if (!config.triggerTerms || !Array.isArray(config.triggerTerms) || config.triggerTerms.length === 0) {
      console.log('✅ [shouldShowToggle] No trigger terms defined - showing toggle by default');
      return true;
    }

    console.log('🔍 [shouldShowToggle] Trigger terms:', config.triggerTerms);
    const descriptionText = getProductDescriptionText();
    if (!descriptionText) {
      console.log('❌ [shouldShowToggle] No description text found - returning false');
      return false;
    }

    const hasMatch = config.triggerTerms.some(term => {
      if (!term || typeof term !== 'string') return false;
      const match = descriptionText.includes(term.toUpperCase());
      console.log('🔍 [shouldShowToggle] Checking term "' + term.toUpperCase() + '":', match);
      return match;
    });
    console.log('✅ [shouldShowToggle] Result:', hasMatch);
    return hasMatch;
  }

  /**
   * Get the option group/select element that contains the configured option labels
   */
  function getToggleOptionElement() {
    console.log('🔍 [getToggleOptionElement] Looking for select with option labels...');
    const config = getActiveConfig();
    if (!config || !config.optionLabels) {
      console.log('❌ [getToggleOptionElement] No config or optionLabels');
      return null;
    }

    console.log('🔍 [getToggleOptionElement] Looking for options:', config.optionLabels);
    const selects = document.querySelectorAll('select');
    console.log('🔍 [getToggleOptionElement] Found ' + selects.length + ' select elements');
    
    for (let select of selects) {
      const options = select.querySelectorAll('option');
      console.log('🔍 [getToggleOptionElement] Checking select with ' + options.length + ' options');
      for (let option of options) {
        const optionText = option.innerText.trim();
        console.log('  - Option text:', optionText);
        if (config.optionLabels.includes(optionText)) {
          console.log('✅ [getToggleOptionElement] Found matching select! Option found:', optionText);
          return select;
        }
      }
    }

    console.log('❌ [getToggleOptionElement] No matching select found');
    return null;
  }

  /**
   * Create the toggle switch HTML
   */
  function createToggleSwitch(isOn = false) {
    const labels = getOptionLabels();
    if (!labels) return null;

    const container = document.createElement('div');
    container.className = 'toggle-container';
    container.innerHTML = `
      <div class="toggle-wrapper">
        <input type="checkbox" id="optionToggle" class="toggle-input" ${isOn ? 'checked' : ''}>
        <label for="optionToggle" class="toggle-switch">
          <span class="toggle-slider"></span>
          <span class="toggle-text toggle-text-off">${labels.off}</span>
          <span class="toggle-text toggle-text-on">${labels.on}</span>
        </label>
      </div>
    `;
    return container;
  }

  /**
   * Add CSS styles for the toggle
   */
  function addToggleStyles() {
    if (document.getElementById('toggle-styles')) return;

    const style = document.createElement('style');
    style.id = 'toggle-styles';
    style.textContent = `
      .toggle-container {
        margin: 15px 0;
      }

      .toggle-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .toggle-input {
        display: none;
      }

      .toggle-switch {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        user-select: none;
        min-width: 200px;
      }

      .toggle-slider {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 28px;
        background-color: #ccc;
        border-radius: 14px;
        transition: background-color 0.3s ease;
      }

      .toggle-slider::before {
        content: '';
        position: absolute;
        height: 24px;
        width: 24px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        border-radius: 50%;
        transition: transform 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .toggle-input:checked + .toggle-switch .toggle-slider {
        background-color: #333;
      }

      .toggle-input:checked + .toggle-switch .toggle-slider::before {
        transform: translateX(22px);
      }

      .toggle-text {
        font-size: 14px;
        font-weight: 500;
        min-width: 100px;
      }

      .toggle-text-on {
        display: none;
        color: #333;
      }

      .toggle-text-off {
        display: inline;
        color: #666;
      }

      .toggle-input:checked + .toggle-switch .toggle-text-off {
        display: none;
      }

      .toggle-input:checked + .toggle-switch .toggle-text-on {
        display: inline;
      }

      /* Responsive adjustments */
      @media (max-width: 600px) {
        .toggle-switch {
          gap: 8px;
          min-width: auto;
        }

        .toggle-slider {
          width: 44px;
          height: 24px;
        }

        .toggle-slider::before {
          height: 20px;
          width: 20px;
        }

        .toggle-input:checked + .toggle-switch .toggle-slider::before {
          transform: translateX(20px);
        }

        .toggle-text {
          font-size: 12px;
          min-width: 80px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Get option value by name
   */
  function getOptionValueByLabel(label) {
    console.log('🔍 [getOptionValueByLabel] Looking for option value for label:', label);
    const options = document.querySelectorAll('select option, .product_option_group option');
    console.log('🔍 [getOptionValueByLabel] Found ' + options.length + ' option elements');
    for (let option of options) {
      const optionText = option.innerText.trim();
      if (optionText === label.trim()) {
        const value = option.value;
        console.log('✅ [getOptionValueByLabel] Found matching option with value:', value);
        return value;
      }
    }
    console.log('❌ [getOptionValueByLabel] No matching option found for label:', label);
    return null;
  }

  /**
   * Update product option when toggle changes
   */
  function updateProductOption(isToggleOn) {
    console.log('🔄 [updateProductOption] Updating option, isToggleOn:', isToggleOn);
    const toggleElement = getToggleOptionElement();
    if (!toggleElement) {
      console.log('❌ [updateProductOption] Could not find toggle element');
      return;
    }

    const labels = getOptionLabels();
    if (!labels) {
      console.log('❌ [updateProductOption] Could not get option labels');
      return;
    }

    const optionLabel = isToggleOn ? labels.on : labels.off;
    console.log('🔄 [updateProductOption] Setting option to:', optionLabel);
    const optionValue = getOptionValueByLabel(optionLabel);

    if (!optionValue) {
      console.log('❌ [updateProductOption] Could not find option value for:', optionLabel);
      return;
    }

    // Find the select element
    const selectElement = toggleElement.tagName === 'SELECT' 
      ? toggleElement 
      : toggleElement.querySelector('select');

    if (selectElement) {
      console.log('🔄 [updateProductOption] Setting select value to:', optionValue);
      selectElement.value = optionValue;
      // Trigger change event to update other dropdowns and images
      console.log('🔄 [updateProductOption] Dispatching change event');
      selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      console.log('❌ [updateProductOption] Could not find select element');
    }
  }

  /**
   * Swap product images based on toggle state
   */
  function swapProductImages(isToggleOn) {
    console.log('🖼️ [swapProductImages] Starting, isToggleOn:', isToggleOn);
    const config = getActiveConfig();
    if (!config || !config.swapImages) {
      console.log('🖼️ [swapProductImages] Image swapping disabled or no config');
      return;
    }

    const primaryImage = document.querySelector('.primary-image');
    const secondaryImages = document.querySelectorAll('.secondary-product-images img');

    console.log('🖼️ [swapProductImages] Primary image found:', !!primaryImage);
    console.log('🖼️ [swapProductImages] Secondary images found:', secondaryImages.length);

    if (!primaryImage) {
      console.log('❌ [swapProductImages] No primary image found');
      return;
    }

    const originalSrc = primaryImage.src || primaryImage.dataset.src;
    const originalSrcset = primaryImage.srcset || primaryImage.dataset.srcset || '';
    if (!primaryImage.dataset.originalSrc) {
      primaryImage.dataset.originalSrc = originalSrc || '';
      primaryImage.dataset.originalSrcset = originalSrcset || '';
      console.log('🖼️ [swapProductImages] Stored original src:', originalSrc);
    }

    if (isToggleOn) {
      const offset = typeof config.secondImageOffset === 'number' ? config.secondImageOffset : 1;
      const index = Math.max(0, offset - 1);
      console.log('🖼️ [swapProductImages] Swapping to image at offset:', offset, '(index:', index + ')');
      if (secondaryImages.length <= index) {
        console.log('❌ [swapProductImages] Not enough secondary images (need index ' + index + ', have ' + secondaryImages.length + ')');
        return;
      }

      const secondImage = secondaryImages[index];
      const newSrc = secondImage.src || secondImage.dataset.src;
      const newSrcset = secondImage.srcset || secondImage.dataset.srcset;

      console.log('🖼️ [swapProductImages] New src:', newSrc);
      if (newSrc) primaryImage.src = newSrc;
      if (newSrcset) primaryImage.srcset = newSrcset;
    } else {
      console.log('🖼️ [swapProductImages] Restoring original image');
      if (primaryImage.dataset.originalSrc) {
        console.log('🖼️ [swapProductImages] Restored src:', primaryImage.dataset.originalSrc);
        primaryImage.src = primaryImage.dataset.originalSrc;
      }
      if (primaryImage.dataset.originalSrcset) {
        primaryImage.srcset = primaryImage.dataset.originalSrcset;
      }
    }
  }

  /**
   * Initialize the toggle
   */
  function init() {
    console.log('🚀 [init] SCRIPT STARTING...');
    console.log('🚀 [init] Document.readyState:', document.readyState);
    
    // Check if we should show the toggle
    if (!shouldShowToggle()) {
      console.log('❌ [init] shouldShowToggle() returned false - exiting');
      return;
    }

    console.log('✅ [init] shouldShowToggle() returned true - proceeding');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      console.log('⏳ [init] DOM still loading, waiting for DOMContentLoaded...');
      document.addEventListener('DOMContentLoaded', initToggle);
    } else {
      console.log('⏳ [init] DOM already ready, calling initToggle immediately');
      initToggle();
    }
  }

  function initToggle() {
    console.log('🔧 [initToggle] Starting toggle initialization...');
    const toggleElement = getToggleOptionElement();
    if (!toggleElement) {
      console.log('❌ [initToggle] getToggleOptionElement returned null - exiting');
      return;
    }
    console.log('✅ [initToggle] Found toggle element:', toggleElement);

    // Add styles
    console.log('🎨 [initToggle] Adding toggle styles...');
    addToggleStyles();

    // Create and insert toggle
    console.log('🎨 [initToggle] Creating toggle switch...');
    const toggle = createToggleSwitch();
    if (!toggle) {
      console.log('❌ [initToggle] createToggleSwitch returned null - exiting');
      return;
    }
    console.log('✅ [initToggle] Toggle created:', toggle);
    
    console.log('🎨 [initToggle] Inserting toggle before select element...');
    toggleElement.parentElement?.insertBefore(toggle, toggleElement);

    // Hide the original dropdown
    console.log('🎨 [initToggle] Hiding original select...');
    toggleElement.style.display = 'none';

    // Get initial state
    const selectElement = toggleElement.tagName === 'SELECT' 
      ? toggleElement 
      : toggleElement.querySelector('select');

    const optionLabels = getOptionLabels();
    const initialValue = selectElement?.value;
    console.log('🔍 [initToggle] Initial select value:', initialValue);
    console.log('🔍 [initToggle] Looking for matching option value for label:', optionLabels?.on);
    const onValue = getOptionValueByLabel(optionLabels.on);
    console.log('🔍 [initToggle] Value for "on" label:', onValue);
    const isInitiallyOn = optionLabels && initialValue?.toString() === onValue;

    console.log('🔍 [initToggle] Is initially on?', isInitiallyOn);
    if (isInitiallyOn) {
      document.getElementById('optionToggle').checked = true;
    }

    // Handle toggle changes
    console.log('👂 [initToggle] Adding change listener to toggle...');
    const toggleCheckbox = document.getElementById('optionToggle');
    if (toggleCheckbox) {
      toggleCheckbox.addEventListener('change', function(e) {
        console.log('🔄 [toggle change] Toggle changed to:', e.target.checked);
        updateProductOption(e.target.checked);
        swapProductImages(e.target.checked);
      });
      console.log('✅ [initToggle] Toggle initialized successfully!');
    } else {
      console.log('❌ [initToggle] Could not find #optionToggle checkbox');
    }
  }

  // Initialize when script loads
  console.log('🌟 [LOAD] product-color-toggle-copy-2.js loaded!');
  init();
})();
