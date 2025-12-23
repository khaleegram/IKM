'use server';

import { z } from "zod";
import dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);
const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

const verifyDnsSchema = z.object({
  domain: z.string().min(1),
  recordType: z.enum(['A', 'CNAME', 'TXT']),
  expectedValue: z.string().optional(),
});

/**
 * Verify DNS record for domain
 */
export async function verifyDnsRecord(data: unknown) {
  const validation = verifyDnsSchema.safeParse(data);
  
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
  }

  const { domain, recordType, expectedValue } = validation.data;

  try {
    let records: string[] = [];
    let verified = false;

    if (recordType === 'A') {
      const aRecords = await resolve4(domain);
      records = aRecords;
      if (expectedValue) {
        verified = aRecords.includes(expectedValue);
      } else {
        verified = aRecords.length > 0;
      }
    } else if (recordType === 'CNAME') {
      // CNAME resolution
      try {
        const cnameRecords = await resolve4(domain);
        records = cnameRecords;
        verified = cnameRecords.length > 0;
      } catch (error) {
        // CNAME might point to another domain
        verified = false;
      }
    } else if (recordType === 'TXT') {
      const txtRecords = await resolveTxt(domain);
      records = txtRecords.flat();
      if (expectedValue) {
        verified = records.some(record => record.includes(expectedValue));
      } else {
        verified = records.length > 0;
      }
    }

    return {
      success: true,
      verified,
      records,
      message: verified 
        ? `DNS ${recordType} record verified successfully`
        : `DNS ${recordType} record not found or doesn't match expected value`,
    };
  } catch (error) {
    return {
      success: false,
      verified: false,
      records: [],
      message: error instanceof Error ? error.message : 'DNS verification failed',
    };
  }
}

/**
 * Verify domain ownership via DNS TXT record
 */
export async function verifyDomainOwnership(domain: string, verificationCode: string) {
  try {
    const txtRecords = await resolveTxt(domain);
    const allRecords = txtRecords.flat();
    const verified = allRecords.some(record => record.includes(verificationCode));
    
    return {
      success: verified,
      message: verified 
        ? 'Domain ownership verified'
        : 'Verification code not found in DNS TXT records',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'DNS verification failed',
    };
  }
}

