// JA3 fingerprinting reference — shown in the web dashboard as the detection technique.
// In a production patched firewall, the TLS ClientHello would be parsed at the NIC
// level and hashed here before any application-layer inspection.
//
// Format: MD5(TLSVersion, CipherSuites, Extensions, EllipticCurves, ECPointFormats)
// GREASE values (RFC 8701) are filtered before hashing.
//
// This file is kept as reference documentation for the assessment report.

export const JA3_REFERENCE = {
  standard_browser_tls13: {
    label: 'Chrome / TLS 1.3',
    ja3String: '772,4866-4867-4865-49196-49200-49195-49199-52393-52392,0-23-65281-10-11-35-16-5-13-18-51-45-43-21,29-23-24,0',
    hash: '-- computed at runtime --',
  },
  domain_fronting_client_tls12: {
    label: 'Domain Fronting Client / TLS 1.2',
    ja3String: '771,49195-49199-52393-52392-49196-49200-49162-49161-49171-49172-51-57-47-53-10,0-5-10-11-13-23-35,23-24-25,0',
    hash: '-- computed at runtime --',
    blocklisted: true,
  },
}
