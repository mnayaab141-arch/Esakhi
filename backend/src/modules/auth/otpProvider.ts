import { timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

export interface OtpProvider {
  request(phoneE164: string): Promise<string | undefined>;
  verify(phoneE164: string, requestId: string | undefined, code: string): Promise<boolean>;
}

class DevelopmentOtpProvider implements OtpProvider {
  async request(_phoneE164: string): Promise<string | undefined> {
    return undefined;
  }

  async verify(_phoneE164: string, _requestId: string | undefined, code: string): Promise<boolean> {
    const expected = env.DEV_OTP_CODE;
    if (!expected || expected.length !== code.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(expected), Buffer.from(code));
  }
}

interface Msg91Response {
  type?: string;
  request_id?: string;
}

class Msg91OtpProvider implements OtpProvider {
  private readonly baseUrl = 'https://control.msg91.com/api/v5/otp';

  async request(phoneE164: string): Promise<string | undefined> {
    const url = new URL(this.baseUrl);
    url.searchParams.set('template_id', env.MSG91_OTP_TEMPLATE_ID ?? '');
    url.searchParams.set('mobile', phoneE164.replace('+', ''));
    url.searchParams.set('otp_length', '6');
    url.searchParams.set('otp_expiry', '5');

    let response: globalThis.Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { authkey: env.MSG91_AUTH_KEY ?? '', 'content-type': 'application/json' },
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      throw new AppError(503, 'OTP_PROVIDER_UNAVAILABLE', 'The OTP provider could not be reached.');
    }
    const body = await this.readResponse(response);
    if (!response.ok || body.type?.toLowerCase() !== 'success' || !body.request_id) {
      throw new AppError(503, 'OTP_PROVIDER_UNAVAILABLE', 'Unable to send a verification code right now.');
    }
    return body.request_id;
  }

  async verify(phoneE164: string, _requestId: string | undefined, code: string): Promise<boolean> {
    const url = new URL(`${this.baseUrl}/verify`);
    url.searchParams.set('mobile', phoneE164.replace('+', ''));
    url.searchParams.set('otp', code);
    let response: globalThis.Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { authkey: env.MSG91_AUTH_KEY ?? '' },
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      throw new AppError(503, 'OTP_PROVIDER_UNAVAILABLE', 'The OTP provider could not be reached.');
    }
    const body = await this.readResponse(response);
    if (!response.ok) {
      throw new AppError(503, 'OTP_PROVIDER_UNAVAILABLE', 'The OTP provider could not verify the code.');
    }
    return body.type?.toLowerCase() === 'success';
  }

  private async readResponse(response: globalThis.Response): Promise<Msg91Response> {
    try {
      const body: unknown = await response.json();
      if (typeof body === 'object' && body !== null) {
        const type = 'type' in body && typeof body.type === 'string' ? body.type : undefined;
        const requestId = 'request_id' in body && typeof body.request_id === 'string'
          ? body.request_id
          : undefined;
        return {
          ...(type === undefined ? {} : { type }),
          ...(requestId === undefined ? {} : { request_id: requestId }),
        };
      }
    } catch {
      throw new AppError(503, 'OTP_PROVIDER_UNAVAILABLE', 'The OTP provider returned an invalid response.');
    }
    throw new AppError(503, 'OTP_PROVIDER_UNAVAILABLE', 'The OTP provider returned an invalid response.');
  }
}

export const otpProvider: OtpProvider =
  env.OTP_PROVIDER === 'msg91' ? new Msg91OtpProvider() : new DevelopmentOtpProvider();
