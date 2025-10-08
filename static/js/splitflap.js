(function ($) {
  /* =====================================================================
     HELPERS
     ===================================================================== */

  // Convert a CSS time string (e.g. "110ms", "0.18s") to ms
  function strToMs(timeString) {
    var matchTime = /([.0-9]*)([a-z]*)/i,
        match = matchTime.exec(timeString),
        base  = match[1];
    if (match[2] === "s") base = parseFloat(base) * 1000;
    else base = parseInt(base, 10);
    return Math.ceil(base);
  }

  // Build an array of numbers as strings (inclusive) with zero-padding
  function numRange(start, end) {
    function lzpad(string, paddedlen) {
      var padamt = paddedlen - string.length, o;
      if (padamt > 0) {
        for (o = new Array; padamt > 0; o[--padamt] = "0");
        return (o.join("") + string);
      }
      return string;
    }
    var i, zeropad = 0, output = [];
    if (start.charAt(0) === "0") zeropad = start.length;
    for (i = parseInt(start, 10); i <= parseInt(end, 10); i++) {
      output.push(lzpad(i.toString(), zeropad));
    }
    return output;
  }

  /* =====================================================================
     GLYPH SETS (things a segment is allowed to display)
     ===================================================================== */
  var glyphSets = {
    alphabetic  : " ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    alphanumeric: " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    extended    : " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*.?\"+-=/<>:)(",
    huge        : " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*.?\"+-=/<>:)(",
    decimal     : " 0123456789.",
    digits      : " 0123456789",
    hex         : " 0123456789ABCDEF",
    twelve      : numRange("1", "12"),
    twentyfour  : numRange("0", "23"),
    minutes     : numRange("00", "59")
  };

  // Default widget options
  var defaults = {
    tickLength: 120,
    glyphSet: glyphSets.alphanumeric,
    initial: "",
    defaultSegments: 5
  };

  // Create a single flap element (<li>) containing a glyph
  function flap(value) { return $("<li>" + value + "</li>"); }

  /* =====================================================================
     SEGMENT (one tile with a TOP and BOTTOM stack)
     ===================================================================== */
  function segment(display, element, options) {
    // Reuse provided .segment element or create a new one
    if (!element) {
      if (display.suppliedElements && !options.dryrun) {
        element = display.suppliedElements.eq(display.segments.length);
      } else {
        element = $('<div class="segment"></div>');
        display.element.append(element);
      }
    }
    this.element = element;

    // Each segment can have a different glyph set (via data index)
    var glyphSet      = display.options.glyphSet,
        glyphSetIndex = element.data("glyphSetIndex");
    if (!options.dryrun && glyphSetIndex !== undefined) glyphSet = glyphSet[glyphSetIndex];
    else glyphSet = glyphSet[0];

    // If the set doesn't include both cases, treat matching as case-insensitive
    this.ignoreCase = !(/A-Z/.test(glyphSet) && /a-z/.test(glyphSet));

    // Two ordered lists hold the stacks for the top and bottom halves
    this.top = $('<ol class="top"></ol>');    $.extend(this.top, { currentFlap: null });
    this.bot = $('<ol class="bottom"></ol>'); $.extend(this.bot, { currentFlap: null });
    element.append(this.top, this.bot);

    // Dry run: add a single empty flap to each half and bail
    if (options.dryrun) { this.top.append(flap("")); this.bot.append(flap("")); return; }

    var self = this;
    this.display  = display;
    this.glyphSet = glyphSet;
    if (!options.initial) options.initial = glyphSet[0];
    this.target = options.initial;

    var i, z, targetIndex = this.glyphSet.indexOf(this.target);
    if (targetIndex === -1) targetIndex = 0;

    function wrap(val) { return (val + self.glyphSet.length) % self.glyphSet.length; }

    // Seed the stacks with hidden history + a small visible cache
    for (i = display.segTopLifespan - 1; i >= 0; i--) {
      z = wrap(i + targetIndex - display.segTopLifespan);
      this.top.append(flap(glyphSet[z]).css("display", "none"));
    }
    for (i = display.segBotLifespan - 1; i >= 0; i--) {
      z = wrap(i + targetIndex - display.segBotLifespan);
      this.bot.prepend(flap(glyphSet[z]).css("display", "none"));
    }
    for (i = 0; i < display.cacheFrames; i++) {
      z = wrap(i + targetIndex);
      this.top.prepend(flap(glyphSet[z]));
      this.bot.append(flap(glyphSet[z]));
    }

    // Pointers show the same glyph initially
    this.top.currentFlap = this.top.children().eq(display.cacheFrames - 1);
    this.bot.currentFlap = this.bot.children().eq(-display.cacheFrames);
    this.bot.currentFlap.addClass("current");

    this.lastLoaded = wrap(targetIndex + display.cacheFrames - 2);
    this.flipping   = false;
  }

  // Advance toward a target glyph by repeatedly flipping
  segment.prototype.flipTo = function (glyph) {
    var self = this,
        glyphMatcher = new RegExp(glyph, this.ignoreCase ? "i" : undefined),
        setContains  = false, i;

    for (i = 0; i < this.glyphSet.length; i++) {
      if (glyphMatcher.test(this.glyphSet[i])) { setContains = true; break; }
    }
    if (!setContains) return;

    this.target = glyph;

    if (!this.flipping) {
      this.flipping = true;
      (function inner(){
        if (!glyphMatcher.exec(self.top.currentFlap.text())) {
          self.flip();
          setTimeout(inner, self.display.options.tickLength);
        } else {
          self.flipping = false;
        }
      })();
    }
  };

  // Perform one flip step
  segment.prototype.flip = function () {
    this.lastLoaded = (this.lastLoaded + 1) % this.glyphSet.length;

    // Top: falling -> remove oldest -> prepend next -> move pointer
    this.top.currentFlap.addClass("falling");
    this.top.currentFlap.siblings().last().remove();
    this.top.currentFlap.parent().prepend(flap(this.glyphSet[this.lastLoaded]));
    this.top.currentFlap = this.top.currentFlap.prev();

    // Bottom: falling -> remove oldest -> append next -> move pointer
    this.bot.currentFlap.addClass("falling");
    this.bot.currentFlap.siblings().first().remove();
    this.bot.currentFlap.parent().append(flap(this.glyphSet[this.lastLoaded]));
    this.bot.currentFlap = this.bot.currentFlap.next();
    this.bot.currentFlap.addClass("current");
  };

  /* =====================================================================
     jQuery UI WIDGET
     ===================================================================== */
  $.widget("splitflap.splitflap", {
    options: defaults,

    _create: function () {
      if (!this.element.hasClass("splitflap")) this.element.addClass("splitflap");

      // If user supplied child .segment elements, record them
      this.suppliedElements = this.element.find(".segment");
      if (this.suppliedElements.length) {
        this.options.segments = Math.max(this.options.segments || 0, this.suppliedElements.length);
      } else {
        this.suppliedElements = undefined;
      }

      // Decide how many segments to create
      if (!this.options.segments) {
        if (this.options.initial) this.options.segments = this.options.initial.length;
        else if (this.suppliedElements) this.options.segments = this.suppliedElements.length;
        else this.options.segments = this.options.defaultSegments;
      }

      // How many "live" flaps we keep visible in the stack
      this.cacheFrames = 2;

      // Normalize glyphSet option to an array-of-arrays
      if (typeof this.options.glyphSet === "string") {
        this.options.glyphSet = [this.options.glyphSet.split("")];
      } else if (this.options.glyphSet.length === undefined) {
        // Map of selectors -> sets (allow per-segment sets)
        var i = 0, indexed = [];
        for (var s in this.options.glyphSet) {
          indexed.push(this.options.glyphSet[s]);
          this.element.find(s).filter(".segment").data("glyphSetIndex", i);
          i += 1;
        }
        this.options.glyphSet = indexed;
      } else {
        this.options.glyphSet = [this.options.glyphSet];
      }

      // Dry-run a hidden segment to read CSS transition timing
      var tempSeg = new segment(this, null, { dryrun: true }),
          tempHtml = tempSeg.element,
          topFlap  = tempSeg.top.children().first(),
          botFlap  = tempSeg.bot.children().first();

      this.stylePrefix = "";
      if (topFlap.css("-webkit-transition-duration")) this.stylePrefix = "-webkit-";

      this.segTopLifespan = Math.floor(
        strToMs(topFlap.css(this.stylePrefix + "transition-duration")) / this.options.tickLength
      ) + 1;

      this.segBotLifespan = Math.floor(
        (strToMs(botFlap.css(this.stylePrefix + "transition-duration")) +
         strToMs(botFlap.css(this.stylePrefix + "transition-delay"))) / this.options.tickLength
      ) + 2;

      tempHtml.remove();

      // Build segments
      this.segments = [];
      for (var j = 0; j < this.options.segments; j++) {
        this.segments[j] = new segment(this, null, { initial: this.options.initial[j] });
      }
    },

    // Public API: get/set value
    value: function (value) {
      if (value === undefined) {
        var out = [];
        for (var i = 0; i < this.segments.length; i++) out.push(this.segments[i].target);
        return out.join("");
      }

      if (typeof value === "string") value = value.split("");

      // Keep layout stable (convert spaces to nbsp)
      for (var v = 0; v < value.length; v++) value[v] = value[v].replace(" ", "\u00A0");

      for (var k = 0; k < Math.min(value.length, this.segments.length); k++) {
        this.segments[k].flipTo(value[k]);
      }
      for (k = value.length; k < this.segments.length; k++) {
        this.segments[k].flipTo(this.segments[k].glyphSet[0]);
      }
    }
  });

  // Expose glyph sets on $.splitflap for easy access
  $.splitflap = $.splitflap || {};
  $.extend(true, $.splitflap, glyphSets);

})(jQuery);