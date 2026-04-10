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
    const titleEl = document.querySelector('.product-container h1') || document.querySelector('h1');
    if (titleEl && titleEl.innerText) return titleEl.innerText.trim();
    if (document.title) return document.title.split('|')[0].trim();
    return null;
  }

  function getProductConfig() {
    const productName = getProductName();
    if (!productName) return null;
    return PRODUCT_CONFIG[productName] || null;
  }

  function getActiveConfig() {
    return getProductConfig();
  }

  function getOptionLabels() {
    const config = getActiveConfig();
    if (!config || !Array.isArray(config.optionLabels) || config.optionLabels.length < 2) return null;
    return {
      off: config.optionLabels[0],
      on: config.optionLabels[1]
    };
  }

  function getProductDescriptionText() {
    const descriptionEl = document.querySelector('.product-description');
    if (!descriptionEl) return '';
    return descriptionEl.innerText.trim().toUpperCase();
  }

  /**
   * Check whether this product should show the toggle.
   * If triggerTerms are defined, the description must contain at least one.
   * If triggerTerms are not defined, the product is shown whenever it is listed in PRODUCT_CONFIG.
   */
  function shouldShowToggle() {
    const config = getActiveConfig();
    if (!config) return false;

    if (!config.triggerTerms || !Array.isArray(config.triggerTerms) || config.triggerTerms.length === 0) {
      return true;
    }

    const descriptionText = getProductDescriptionText();
    if (!descriptionText) return false;

    return config.triggerTerms.some(term => {
      if (!term || typeof term !== 'string') return false;
      return descriptionText.includes(term.toUpperCase());
    });
  }

  /**
   * Get the option group/select element that contains the configured option labels
   */
  function getToggleOptionElement() {
    const config = getActiveConfig();
    if (!config || !config.optionLabels) return null;

    // Search for a select that contains one of our configured option labels
    const selects = document.querySelectorAll('select');
    for (let select of selects) {
      const options = select.querySelectorAll('option');
      for (let option of options) {
        if (config.optionLabels.includes(option.innerText.trim())) {
          // Found a select with one of our labels
          return select;
        }
      }
    }

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
    const options = document.querySelectorAll('select option, .product_option_group option');
    for (let option of options) {
      if (option.innerText.trim() === label.trim()) {
        return option.value;
      }
    }
    return null;
  }

  /**
   * Update product option when toggle changes
   */
  function updateProductOption(isToggleOn) {
    const toggleElement = getToggleOptionElement();
    if (!toggleElement) return;

    const labels = getOptionLabels();
    if (!labels) return;

    const optionLabel = isToggleOn ? labels.on : labels.off;
    const optionValue = getOptionValueByLabel(optionLabel);

    if (!optionValue) return;

    // Find the select element
    const selectElement = toggleElement.tagName === 'SELECT' 
      ? toggleElement 
      : toggleElement.querySelector('select');

    if (selectElement) {
      selectElement.value = optionValue;
      // Trigger change event to update other dropdowns and images
      selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /**
   * Swap product images based on toggle state
   */
  function swapProductImages(isToggleOn) {
    const config = getActiveConfig();
    if (!config || !config.swapImages) return;

    const primaryImage = document.querySelector('.primary-image');
    const secondaryImages = document.querySelectorAll('.secondary-product-images img');

    if (!primaryImage) return;

    const originalSrc = primaryImage.src || primaryImage.dataset.src;
    const originalSrcset = primaryImage.srcset || primaryImage.dataset.srcset || '';
    if (!primaryImage.dataset.originalSrc) {
      primaryImage.dataset.originalSrc = originalSrc || '';
      primaryImage.dataset.originalSrcset = originalSrcset || '';
    }

    if (isToggleOn) {
      const offset = typeof config.secondImageOffset === 'number' ? config.secondImageOffset : 1;
      const index = Math.max(0, offset - 1);
      if (secondaryImages.length <= index) return;

      const secondImage = secondaryImages[index];
      const newSrc = secondImage.src || secondImage.dataset.src;
      const newSrcset = secondImage.srcset || secondImage.dataset.srcset;

      if (newSrc) primaryImage.src = newSrc;
      if (newSrcset) primaryImage.srcset = newSrcset;
    } else {
      if (primaryImage.dataset.originalSrc) {
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
    // Check if we should show the toggle
    if (!shouldShowToggle()) return;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initToggle);
    } else {
      initToggle();
    }
  }

  function initToggle() {
    const toggleElement = getToggleOptionElement();
    if (!toggleElement) return;

    // Add styles
    addToggleStyles();

    // Create and insert toggle
    const toggle = createToggleSwitch();
    if (!toggle) return;
    toggleElement.parentElement?.insertBefore(toggle, toggleElement);

    // Hide the original dropdown
    toggleElement.style.display = 'none';

    // Get initial state
    const selectElement = toggleElement.tagName === 'SELECT' 
      ? toggleElement 
      : toggleElement.querySelector('select');

    const optionLabels = getOptionLabels();
    const initialValue = selectElement?.value;
    const isInitiallyOn = optionLabels && initialValue?.toString() === getOptionValueByLabel(optionLabels.on);

    if (isInitiallyOn) {
      document.getElementById('optionToggle').checked = true;
    }

    // Handle toggle changes
    document.getElementById('optionToggle').addEventListener('change', function(e) {
      updateProductOption(e.target.checked);
      swapProductImages(e.target.checked);
    });
  }

  // Initialize when script loads
  init();
})();
