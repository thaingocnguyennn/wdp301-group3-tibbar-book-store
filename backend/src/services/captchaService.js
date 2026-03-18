import crypto from 'crypto';

const CAPTCHA_TTL_MS = 5 * 60 * 1000;

class CaptchaService {
  constructor() {
    this.captchas = new Map();

    // Periodically clear expired captcha challenges.
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredCaptchas();
    }, 60 * 1000);

    if (typeof this.cleanupInterval.unref === 'function') {
      this.cleanupInterval.unref();
    }
  }

  generateCaptcha() {
    const first = crypto.randomInt(1, 10);
    const second = crypto.randomInt(1, 10);
    const useAddition = crypto.randomInt(0, 2) === 1;

    let question;
    let answer;

    if (useAddition) {
      question = `${first} + ${second} = ?`;
      answer = String(first + second);
    } else {
      const bigger = Math.max(first, second);
      const smaller = Math.min(first, second);
      question = `${bigger} - ${smaller} = ?`;
      answer = String(bigger - smaller);
    }

    const captchaId = crypto.randomUUID();
    const expiresAt = Date.now() + CAPTCHA_TTL_MS;

    this.captchas.set(captchaId, { answer, expiresAt });

    return {
      captchaId,
      question,
      expiresInSeconds: Math.floor(CAPTCHA_TTL_MS / 1000),
    };
  }

  verifyCaptcha(captchaId, answer) {
    if (!captchaId || answer === undefined || answer === null) {
      return false;
    }

    const storedCaptcha = this.captchas.get(captchaId);

    if (!storedCaptcha) {
      return false;
    }

    const isExpired = storedCaptcha.expiresAt < Date.now();
    if (isExpired) {
      this.captchas.delete(captchaId);
      return false;
    }

    const normalizedAnswer = String(answer).trim();
    const isValid = normalizedAnswer === storedCaptcha.answer;

    // Captcha is single-use regardless of success.
    this.captchas.delete(captchaId);

    return isValid;
  }

  cleanupExpiredCaptchas() {
    const now = Date.now();

    for (const [captchaId, captcha] of this.captchas.entries()) {
      if (captcha.expiresAt < now) {
        this.captchas.delete(captchaId);
      }
    }
  }
}

export default new CaptchaService();
