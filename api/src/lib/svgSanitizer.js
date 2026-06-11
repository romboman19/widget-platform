import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Strict SVG sanitization for icon uploads
 * Removes all potentially dangerous content while preserving valid SVG structure
 */
export function sanitizeSvg(svgContent) {
  // Config: only SVG elements and attributes allowed
  // Explicitly blocks: foreignObject, script, on* events, javascript: URLs
  const config = {
    USE_PROFILES: { svg: true, svgFilters: true },
    
    // Forbid these elements completely
    FORBID_TAGS: [
      'foreignObject',
      'script',
      'iframe',
      'embed',
      'object',
      'audio',
      'video',
      'source',
      'track',
      'input',
      'button',
      'form',
      'textarea',
      'select',
      'option',
      'link',
      'style',
    ],
    
    // Forbid these attributes
    FORBID_ATTR: [
      'onabort', 'onactivate', 'onafterprint', 'onbeforeprint', 'onbeforeunload',
      'onblur', 'onbounce', 'oncancel', 'oncanplay', 'oncanplaythrough', 'onchange',
      'onclick', 'onclose', 'oncontextmenu', 'oncuechange', 'ondblclick', 'onabort',
      'ondrag', 'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 'ondragstart',
      'ondrop', 'ondurationchange', 'onemptied', 'onended', 'onerror', 'onfocus',
      'onhashchange', 'oninput', 'oninvalid', 'onkeydown', 'onkeypress', 'onkeyup',
      'onload', 'onloadeddata', 'onloadedmetadata', 'onloadstart', 'onmessage',
      'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'onmousewheel',
      'onoffline', 'ononline', 'onpagehide', 'onpageshow', 'onpause', 'onplay',
      'onplaying', 'onpopstate', 'onprogress', 'onratechange', 'onreadystatechange',
      'onreset', 'onresize', 'onscroll', 'onseeked', 'onseeking', 'onselect',
      'onshow', 'onstalled', 'onstorage', 'onsubmit', 'onsuspend', 'ontimeupdate',
      'ontoggle', 'onunload', 'onvolumechange', 'onwaiting', 'onwheel', 'onzoom',
    ],
    
    // Block data URIs and javascript: in href/src
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    
    // Keep namespace for proper SVG rendering
    NAMESPACE: 'http://www.w3.org/2000/svg',
    
    // Return DOM instead of string for validation
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  };
  
  const clean = purify.sanitize(svgContent, config);
  
  // Additional post-processing: remove any remaining javascript: URLs
  // and block data URIs in image elements
  let sanitized = clean
    .replace(/javascript:/gi, 'blocked:')
    .replace(/data:text\/html/gi, 'blocked:text/html')
    .replace(/data:image\/svg\+xml[^"]*"/gi, '"')
    .replace(/data:image\/svg\+xml[^']*'/gi, "'")
    .replace(/\u003c!--/g, '')
    .replace(/--\u003e/g, '');
  
  // Ensure SVG has proper namespace
  if (!sanitized.includes('xmlns=')) {
    sanitized = sanitized.replace(
      /\u003csvg/i,
      '<svg xmlns="http://www.w3.org/2000/svg"'
    );
  }
  
  return sanitized;
}

/**
 * Validates if content is safe SVG (for additional safety layer)
 */
export function isSafeSvg(svgContent) {
  const dangerous = [
    /\u003cscript/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /\u003cforeignObject/i,
    /\u003ciframe/i,
    /\u003cembed/i,
    /\u003cobject/i,
    /data:text\/html/i,
    /\u003cimage[^\u003e]*href=["']data:/i,
  ];
  
  return !dangerous.some(pattern => pattern.test(svgContent));
}

/**
 * Extract dimensions from SVG content
 */
export function extractSvgDimensions(svgContent) {
  const result = { width: null, height: null };
  
  // Try viewBox
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/i);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/\s+/).map(Number);
    if (parts.length === 4 && !isNaN(parts[2]) && !isNaN(parts[3])) {
      result.width = parts[2];
      result.height = parts[3];
    }
  }
  
  // Try width/height attributes
  if (!result.width) {
    const widthMatch = svgContent.match(/width=["']([^"']+)["']/i);
    if (widthMatch) {
      const val = parseFloat(widthMatch[1]);
      if (!isNaN(val)) result.width = val;
    }
  }
  
  if (!result.height) {
    const heightMatch = svgContent.match(/height=["']([^"']+)["']/i);
    if (heightMatch) {
      const val = parseFloat(heightMatch[1]);
      if (!isNaN(val)) result.height = val;
    }
  }
  
  return result;
}
