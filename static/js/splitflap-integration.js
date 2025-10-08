/* static/js/splitflap-integration.js */
/* Activates split-flap time display when monospace typography is selected */

(function() {
  'use strict';
  
  // Wait for jQuery and the splitflap plugin to load
  function initSplitFlap() {
    if (typeof jQuery === 'undefined' || !jQuery.fn.splitflap) {
      setTimeout(initSplitFlap, 100);
      return;
    }
    
    const $ = jQuery;
    let splitflapInstance = null;
    let clockInterval = null;
    
    // Create container for split-flap display (initially hidden)
    const $timeCell = $('#timeValue').parent();
    const $splitflapContainer = $('<div id="splitflap-time-container"></div>');
    const $splitflapDisplay = $('<div id="splitflap-time" class="splitflap-time"></div>');
    $splitflapContainer.append($splitflapDisplay);
    $timeCell.append($splitflapContainer);
    
    // Helper: Get current time parts for 12-hour format
    function getTimeParts() {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12; // Convert to 12-hour format
      
      return {
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        display: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`
      };
    }
    
    // Initialize the split-flap widget
    function createSplitFlap() {
      if (splitflapInstance) return; // Already created
      
      const time = getTimeParts();
      
      // Create segments: HH : MM space AM/PM
      const segments = [
        // Hours (2 digits)
        ...time.hours.split(''),
        ':', // Colon separator
        // Minutes (2 digits)  
        ...time.minutes.split(''),
        ' ', // Space before AM/PM
        // AM/PM (2 chars)
        ...time.display.slice(-2).split('')
      ];
      
      try {
        splitflapInstance = $splitflapDisplay.splitflap({
          initial: segments.join(''),
          glyphSet: ' 0123456789:APM',
          tickLength: 100
        });
        
        // Start clock updates
        updateSplitFlapClock();
      } catch (e) {
        console.error('Split-flap initialization failed:', e);
      }
    }
    
    // Update split-flap display every second
    function updateSplitFlapClock() {
      if (!splitflapInstance) return;
      
      const time = getTimeParts();
      const value = `${time.hours}:${time.minutes} ${time.display.slice(-2)}`;
      
      try {
        splitflapInstance.splitflap('value', value);
      } catch (e) {
        console.error('Split-flap update failed:', e);
      }
      
      // Schedule next update
      clockInterval = setTimeout(updateSplitFlapClock, 1000 - (Date.now() % 1000));
    }
    
    // Destroy split-flap instance
    function destroySplitFlap() {
      if (clockInterval) {
        clearTimeout(clockInterval);
        clockInterval = null;
      }
      
      if (splitflapInstance) {
        try {
          $splitflapDisplay.empty();
          splitflapInstance = null;
        } catch (e) {
          console.error('Split-flap cleanup failed:', e);
        }
      }
    }
    
    // Toggle between normal time and split-flap based on typography
    function toggleTimeDisplay(fontTheme) {
      const $normalTime = $('#timeValue');
      
      if (fontTheme === 'mono') {
        // Switch to split-flap
        $normalTime.addClass('hidden');
        $splitflapContainer.addClass('active');
        createSplitFlap();
      } else {
        // Switch to normal time
        $normalTime.removeClass('hidden');
        $splitflapContainer.removeClass('active');
        destroySplitFlap();
      }
    }
    
    // Listen for font changes (custom event from themes.js)
    document.addEventListener('fontChanged', function(e) {
      const fontTheme = e.detail.font;
      toggleTimeDisplay(fontTheme);
    });
    
    // Check initial state on page load - FIXED: use correct localStorage key
    const savedFont = localStorage.getItem('nh.font') || 'inter';
    if (savedFont === 'mono') {
      // Small delay to ensure DOM is ready
      setTimeout(() => toggleTimeDisplay('mono'), 150);
    }
  }
  
  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSplitFlap);
  } else {
    initSplitFlap();
  }
})();