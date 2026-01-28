import { headers } from 'next/headers';

/**
 * Validates if a string is a valid IPv4 or IPv6 address
 */
export function isValidIp(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?::(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?$/;

    if (ipv4Regex.test(ip)) {
        return ip.split('.').every(part => parseInt(part, 10) <= 255);
    }

    return ipv6Regex.test(ip);
}

/**
 * Get client IP for rate limiting and security logging.
 * Prioritizes trusted headers from cloud platforms (like Vercel).
 * 
 * @param headersList Optional headers object. If not provided, it will attempt to use next/headers.
 * @returns {string} The detected IP address or '127.0.0.1' as fallback.
 */
export async function getClientIp(headersList?: Headers): Promise<string> {
    const activeHeaders = headersList || await headers();

    // 1. Prioritize platform-specific trusted headers
    // x-real-ip is set by Vercel to the actual client IP
    const realIp = activeHeaders.get('x-real-ip');
    if (realIp && isValidIp(realIp)) return realIp;

    // 2. Vercel specific proxied-for header
    const proxiedFor = activeHeaders.get('x-vercel-proxied-for');
    if (proxiedFor) {
        const firstIp = proxiedFor.split(',')[0]?.trim();
        if (firstIp && isValidIp(firstIp)) return firstIp;
    }

    // 3. Fallback to x-forwarded-for (standard but can be spoofed)
    const forwardedFor = activeHeaders.get('x-forwarded-for');
    if (forwardedFor) {
        // We take the first IP in the list, which is the client's IP
        const firstIp = forwardedFor.split(',')[0]?.trim();
        if (firstIp && isValidIp(firstIp)) return firstIp;
    }

    // 4. Final fallback for local development
    return '127.0.0.1';
}
