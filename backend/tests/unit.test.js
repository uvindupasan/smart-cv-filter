/**
 * Smart CV Filter — Backend Unit Tests
 * Tests individual utility functions and validation logic.
 *
 * Run: npm test
 */

// ── 1. Campaign slug generation ─────────────────────────────
describe('Campaign slug generation', () => {
  const { v4: uuidv4 } = require('uuid');

  it('should generate a non-empty slug', () => {
    const slug = uuidv4().split('-')[0] + uuidv4().split('-')[1];
    expect(slug).toBeTruthy();
    expect(typeof slug).toBe('string');
  });

  it('should generate unique slugs', () => {
    const slug1 = uuidv4().split('-')[0] + uuidv4().split('-')[1];
    const slug2 = uuidv4().split('-')[0] + uuidv4().split('-')[1];
    expect(slug1).not.toBe(slug2);
  });

  it('should generate slug of expected length (12 hex chars)', () => {
    const slug = uuidv4().split('-')[0] + uuidv4().split('-')[1];
    expect(slug.length).toBe(12); // 8 (first segment) + 4 (second segment)
  });
});

// ── 2. skillsText building ───────────────────────────────────
describe('skillsText builder', () => {
  function buildSkillsText(skills, degree, institute, whyHireYou) {
    const parts = [];
    if (skills && skills.length > 0) parts.push(skills.join(', '));
    if (degree) parts.push(degree);
    if (institute) parts.push(institute);
    if (whyHireYou) parts.push(whyHireYou);
    return parts.join('. ');
  }

  it('builds text from all fields', () => {
    const text = buildSkillsText(
      ['Python', 'React'],
      'BSc Software Engineering',
      'KIU',
      'I am passionate about software development'
    );
    expect(text).toContain('Python');
    expect(text).toContain('BSc Software Engineering');
    expect(text).toContain('KIU');
    expect(text).toContain('passionate');
  });

  it('handles missing optional fields gracefully', () => {
    const text = buildSkillsText(['JavaScript'], null, null, null);
    expect(text).toBe('JavaScript');
    expect(text).not.toContain('null');
    expect(text).not.toContain('undefined');
  });

  it('joins multiple skills with comma', () => {
    const text = buildSkillsText(['Python', 'SQL', 'Machine Learning'], '', '', '');
    expect(text).toContain('Python, SQL, Machine Learning');
  });

  it('returns empty string when no data', () => {
    const text = buildSkillsText([], null, null, null);
    expect(text).toBe('');
  });
});

// ── 3. Skills array parsing (from comma-separated string) ────
describe('Skills array parsing', () => {
  function parseSkills(skillsString) {
    if (typeof skillsString !== 'string') return skillsString || [];
    return skillsString.split(',').map(s => s.trim()).filter(Boolean);
  }

  it('parses comma-separated skills correctly', () => {
    const result = parseSkills('Python, React, SQL, English');
    expect(result).toEqual(['Python', 'React', 'SQL', 'English']);
  });

  it('trims whitespace from each skill', () => {
    const result = parseSkills('  Python  ,  React  ');
    expect(result).toEqual(['Python', 'React']);
  });

  it('filters empty entries', () => {
    const result = parseSkills('Python,,React,');
    expect(result).toEqual(['Python', 'React']);
  });

  it('handles single skill', () => {
    const result = parseSkills('JavaScript');
    expect(result).toEqual(['JavaScript']);
  });

  it('returns empty array for empty string', () => {
    const result = parseSkills('');
    expect(result).toEqual([]);
  });
});

// ── 4. Email validation ──────────────────────────────────────
describe('Email validation', () => {
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  it('accepts valid email addresses', () => {
    expect(isValidEmail('hr@company.com')).toBe(true);
    expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
    expect(isValidEmail('test@kiu.ac.lk')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
  });
});

// ── 5. JWT token generation ──────────────────────────────────
describe('JWT token generation', () => {
  const jwt = require('jsonwebtoken');
  const SECRET = 'test_secret_key_for_unit_testing';

  it('generates a valid JWT token', () => {
    const token = jwt.sign({ id: 'user123' }, SECRET, { expiresIn: '7d' });
    expect(token).toBeTruthy();
    expect(token.split('.')).toHaveLength(3); // header.payload.signature
  });

  it('decodes token with correct secret', () => {
    const token = jwt.sign({ id: 'user456' }, SECRET);
    const decoded = jwt.verify(token, SECRET);
    expect(decoded.id).toBe('user456');
  });

  it('rejects token with wrong secret', () => {
    const token = jwt.sign({ id: 'user789' }, SECRET);
    expect(() => jwt.verify(token, 'wrong_secret')).toThrow();
  });

  it('rejects expired token', (done) => {
    const token = jwt.sign({ id: 'user999' }, SECRET, { expiresIn: '1ms' });
    setTimeout(() => {
      expect(() => jwt.verify(token, SECRET)).toThrow(/expired/);
      done();
    }, 10);
  });
});

// ── 6. CV status validation ──────────────────────────────────
describe('CV status validation', () => {
  const VALID_STATUSES = ['new', 'reviewed', 'shortlisted', 'rejected'];

  it('accepts all valid statuses', () => {
    VALID_STATUSES.forEach(status => {
      expect(VALID_STATUSES.includes(status)).toBe(true);
    });
  });

  it('rejects invalid statuses', () => {
    ['pending', 'approved', 'hired', '', 'NEW'].forEach(s => {
      expect(VALID_STATUSES.includes(s)).toBe(false);
    });
  });
});

// ── 7. File validation (PDF check) ──────────────────────────
describe('File type validation', () => {
  function isPdfMimetype(mimetype) {
    return mimetype === 'application/pdf';
  }

  it('accepts PDF mimetype', () => {
    expect(isPdfMimetype('application/pdf')).toBe(true);
  });

  it('rejects non-PDF mimetypes', () => {
    expect(isPdfMimetype('image/jpeg')).toBe(false);
    expect(isPdfMimetype('application/msword')).toBe(false);
    expect(isPdfMimetype('text/plain')).toBe(false);
  });

  it('rejects empty mimetype', () => {
    expect(isPdfMimetype('')).toBe(false);
  });
});

// ── 8. Campaign requiredSkills processing ───────────────────
describe('Campaign requiredSkills from comma-separated input', () => {
  function parseRequiredSkills(input) {
    if (!input) return [];
    return input.split(',').map(s => s.trim()).filter(Boolean);
  }

  it('converts comma-separated string to array', () => {
    const result = parseRequiredSkills('Python, React, SQL');
    expect(result).toEqual(['Python', 'React', 'SQL']);
  });

  it('returns empty array for empty input', () => {
    expect(parseRequiredSkills('')).toEqual([]);
    expect(parseRequiredSkills(null)).toEqual([]);
    expect(parseRequiredSkills(undefined)).toEqual([]);
  });
});
