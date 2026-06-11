import { describe, it, expect } from 'vitest';
import { sanitizeSvg, isSafeSvg, extractSvgDimensions } from './svgSanitizer.js';

describe('SVG Sanitizer', () => {
  describe('sanitizeSvg', () => {
    it('should remove script tags', () => {
      const input = '<svg><script>alert(1)</script></svg>';
      const output = sanitizeSvg(input);
      expect(output).not.toContain('<script>');
      expect(output).not.toContain('alert');
    });

    it('should remove on* event handlers', () => {
      const input = '<svg onload="alert(1)" onmouseover="alert(2)"></svg>';
      const output = sanitizeSvg(input);
      expect(output).not.toContain('onload');
      expect(output).not.toContain('onmouseover');
      expect(output).not.toContain('alert');
    });

    it('should block javascript: URLs in href', () => {
      const input = '<svg><a href="javascript:alert(1)">click</a></svg>';
      const output = sanitizeSvg(input);
      expect(output).not.toContain('javascript:');
    });

    it('should remove foreignObject', () => {
      const input = '<svg><foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><script>alert(1)</script></body></foreignObject></svg>';
      const output = sanitizeSvg(input);
      expect(output).not.toContain('foreignObject');
      expect(output).not.toContain('script');
    });

    it('should block data URI images with malicious content', () => {
      const input = '<svg><image href="data:image/svg+xml,&lt;svg onload=alert(1)&gt;" /></svg>';
      const output = sanitizeSvg(input);
      // After sanitization, data URI should be removed or escaped
      expect(output).not.toContain('data:image/svg+xml,&lt;svg');
    });

    it('should preserve valid SVG structure', () => {
      const input = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg>';
      const output = sanitizeSvg(input);
      expect(output).toContain('<svg');
      expect(output).toContain('</svg>');
      expect(output).toContain('viewBox');
    });

    it('should handle nested SVGs safely', () => {
      const input = '<svg><svg onload="alert(1)"></svg></svg>';
      const output = sanitizeSvg(input);
      expect(output).not.toContain('onload');
    });
  });

  describe('isSafeSvg', () => {
    it('should return false for SVG with onload', () => {
      const input = '<svg onload="alert(1)">';
      expect(isSafeSvg(input)).toBe(false);
    });

    it('should return false for SVG with script tag', () => {
      const input = '<svg><script>';
      expect(isSafeSvg(input)).toBe(false);
    });

    it('should return false for SVG with javascript: URL', () => {
      const input = '<svg><a href="javascript:alert(1)">';
      expect(isSafeSvg(input)).toBe(false);
    });

    it('should return false for SVG with foreignObject', () => {
      const input = '<svg><foreignObject>';
      expect(isSafeSvg(input)).toBe(false);
    });

    it('should return true for clean SVG', () => {
      const input = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M12 2z"/></svg>';
      expect(isSafeSvg(input)).toBe(true);
    });
  });

  describe('extractSvgDimensions', () => {
    it('should extract dimensions from viewBox', () => {
      const input = '<svg viewBox="0 0 100 200"></svg>';
      const result = extractSvgDimensions(input);
      expect(result.width).toBe(100);
      expect(result.height).toBe(200);
    });

    it('should extract dimensions from width/height attributes', () => {
      const input = '<svg width="50" height="100"></svg>';
      const result = extractSvgDimensions(input);
      expect(result.width).toBe(50);
      expect(result.height).toBe(100);
    });

    it('should return null for missing dimensions', () => {
      const input = '<svg></svg>';
      const result = extractSvgDimensions(input);
      expect(result.width).toBeNull();
      expect(result.height).toBeNull();
    });
  });
});
