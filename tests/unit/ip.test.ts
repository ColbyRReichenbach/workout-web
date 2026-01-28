import { describe, it, expect, vi } from 'vitest';
import { getClientIp, isValidIp } from '@/lib/ip';

// Mock next/headers
vi.mock('next/headers', () => ({
    headers: vi.fn(),
}));

import { headers } from 'next/headers';

describe('isValidIp', () => {
    it('should validate IPv4 addresses', () => {
        expect(isValidIp('127.0.0.1')).toBe(true);
        expect(isValidIp('192.168.1.1')).toBe(true);
        expect(isValidIp('255.255.255.255')).toBe(true);
        expect(isValidIp('256.256.256.256')).toBe(false);
        expect(isValidIp('1.2.3')).toBe(false);
    });

    it('should validate IPv6 addresses', () => {
        expect(isValidIp('::1')).toBe(true);
        expect(isValidIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
        expect(isValidIp('2001:db8:85a3::8a2e:370:7334')).toBe(true);
        expect(isValidIp('not-an-ip')).toBe(false);
    });
});

describe('getClientIp', () => {
    it('should prioritize x-real-ip', async () => {
        const mockHeaders = new Headers({
            'x-real-ip': '1.2.3.4',
            'x-forwarded-for': '5.6.7.8, 9.10.11.12'
        });

        const ip = await getClientIp(mockHeaders);
        expect(ip).toBe('1.2.3.4');
    });

    it('should use x-vercel-proxied-for if x-real-ip is missing', async () => {
        const mockHeaders = new Headers({
            'x-vercel-proxied-for': '2.3.4.5, 6.7.8.9',
            'x-forwarded-for': '5.6.7.8'
        });

        const ip = await getClientIp(mockHeaders);
        expect(ip).toBe('2.3.4.5');
    });

    it('should use first entry of x-forwarded-for if other trusted headers are missing', async () => {
        const mockHeaders = new Headers({
            'x-forwarded-for': '3.4.5.6, 7.8.9.0'
        });

        const ip = await getClientIp(mockHeaders);
        expect(ip).toBe('3.4.5.6');
    });

    it('should fallback to 127.0.0.1 if no headers are present', async () => {
        const ip = await getClientIp(new Headers());
        expect(ip).toBe('127.0.0.1');
    });

    it('should ignore invalid IPs in headers', async () => {
        const mockHeaders = new Headers({
            'x-real-ip': 'invalid-ip',
            'x-forwarded-for': '4.5.6.7'
        });

        const ip = await getClientIp(mockHeaders);
        expect(ip).toBe('4.5.6.7');
    });

    it('should use next/headers if no headers argument is provided', async () => {
        const mockHeaders = new Headers({ 'x-real-ip': '9.8.7.6' });
        (headers as any).mockResolvedValue(mockHeaders);

        const ip = await getClientIp();
        expect(ip).toBe('9.8.7.6');
        expect(headers).toHaveBeenCalled();
    });
});
