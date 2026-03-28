import axios from 'axios';

class RecaptchaService {
  async verifyToken(token, remoteIp) {
    if (!token) {
      return false;
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      // Fail closed when secret key is missing.
      return false;
    }

    try {
      const params = new URLSearchParams();
      params.append('secret', secret);
      params.append('response', token);

      if (remoteIp) {
        params.append('remoteip', remoteIp);
      }

      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return Boolean(response?.data?.success);
    } catch (error) {
      return false;
    }
  }
}

export default new RecaptchaService();
