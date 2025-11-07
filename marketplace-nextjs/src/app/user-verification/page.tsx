'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Navbar } from '@/components/Navbar';
import type { ProofResult } from '@zkpassport/sdk';
import QRCode from 'react-qr-code';
import { Buffer } from 'buffer';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/config';
import { NILCC_VERIFIED_LIST_ABI } from '@/lib/contracts';

const globalWithBuffer = globalThis as typeof globalThis & {
  Buffer: typeof Buffer;
};

globalWithBuffer.Buffer = Buffer;
if (typeof window !== 'undefined') {
  (window as typeof window & { Buffer: typeof Buffer }).Buffer = Buffer;
}

function attachBigIntMethods(proto: {
  readBigUInt64BE?: (offset?: number) => bigint;
  readBigUInt64LE?: (offset?: number) => bigint;
  writeBigUInt64BE?: (value: bigint, offset?: number) => number;
  writeBigUInt64LE?: (value: bigint, offset?: number) => number;
}) {
  if (!proto) return;

  if (typeof BigInt === 'undefined') {
    return;
  }

  if (!proto.readBigUInt64BE) {
    proto.readBigUInt64BE = function readBigUInt64BE(offset = 0) {
      let result = 0n;
      for (let i = 0; i < 8; i++) {
        result = (result << 8n) + BigInt(this[offset + i]);
      }
      return result;
    };
  }

  if (!proto.readBigUInt64LE) {
    proto.readBigUInt64LE = function readBigUInt64LE(offset = 0) {
      let result = 0n;
      for (let i = 7; i >= 0; i--) {
        result = (result << 8n) + BigInt(this[offset + i]);
      }
      return result;
    };
  }

  if (!proto.writeBigUInt64BE) {
    proto.writeBigUInt64BE = function writeBigUInt64BE(
      value: bigint,
      offset = 0
    ) {
      let temp = BigInt(value);
      for (let i = 7; i >= 0; i--) {
        this[offset + i] = Number(temp & 0xffn);
        temp >>= 8n;
      }
      return offset + 8;
    };
  }

  if (!proto.writeBigUInt64LE) {
    proto.writeBigUInt64LE = function writeBigUInt64LE(
      value: bigint,
      offset = 0
    ) {
      let temp = BigInt(value);
      for (let i = 0; i < 8; i++) {
        this[offset + i] = Number(temp & 0xffn);
        temp >>= 8n;
      }
      return offset + 8;
    };
  }
}

function ensureBigIntBufferMethods(bufferCtor: typeof Buffer) {
  attachBigIntMethods(bufferCtor.prototype);
  attachBigIntMethods(Uint8Array.prototype);
}

ensureBigIntBufferMethods(Buffer);
if (process.env.NODE_ENV !== 'production') {
  console.log(
    '[Verification] Buffer writeBigUInt64BE available:',
    typeof Buffer.prototype.writeBigUInt64BE === 'function'
  );
}

type ZKPassportClass = typeof import('@zkpassport/sdk')['ZKPassport'];
type ZKPassportInstance = InstanceType<ZKPassportClass>;

const NILCC_SERVICE_URL =
  process.env.NEXT_PUBLIC_NILCC_SERVICE_URL || 'http://localhost:3001';

export default function UserVerificationPage() {
  const { authenticated, user, login } = usePrivy();
  const walletAddress = user?.wallet?.address;
  const zkPassportInstanceRef = useRef<ZKPassportInstance | null>(null);
  const zkPassportCtorRef = useRef<ZKPassportClass | null>(null);

  const [message, setMessage] = useState<string>('');
  const [queryUrl, setQueryUrl] = useState<string>('');
  const [isOver18, setIsOver18] = useState<boolean | undefined>(undefined);
  const [uniqueIdentifier, setUniqueIdentifier] = useState('');
  const [verified, setVerified] = useState<boolean | undefined>(undefined);
  const [backendVerified, setBackendVerified] = useState<boolean | undefined>(
    undefined
  );
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [allowReverificationFlow, setAllowReverificationFlow] = useState(false);

  const loadZkPassport = useCallback(async () => {
    if (!authenticated) {
      return null;
    }

    if (typeof window === 'undefined') {
      return null;
    }

    if (!zkPassportCtorRef.current) {
      const sdk = await import('@zkpassport/sdk');
      zkPassportCtorRef.current = sdk.ZKPassport;
    }

    if (!zkPassportInstanceRef.current && zkPassportCtorRef.current) {
      const ZKPassportCtor = zkPassportCtorRef.current;
      zkPassportInstanceRef.current = new ZKPassportCtor(
        window.location.hostname
      );
    }

    return zkPassportInstanceRef.current;
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) {
      zkPassportInstanceRef.current = null;
      zkPassportCtorRef.current = null;
      return;
    }

    loadZkPassport();
  }, [authenticated, loadZkPassport]);

  const verifiedListAddress = CONTRACT_ADDRESSES.NILCC_VERIFIED_LIST;
  const verifiedListArgs = walletAddress
    ? ([walletAddress as `0x${string}`] as const)
    : undefined;

  const {
    data: onChainVerificationData,
    isLoading: isLoadingOnChain,
    refetch: refetchOnChainStatus,
  } = useReadContract({
    address: verifiedListAddress,
    abi: NILCC_VERIFIED_LIST_ABI,
    functionName: 'isOnVerifiedList',
    args: verifiedListArgs,
    query: {
      enabled: Boolean(walletAddress),
      refetchOnWindowFocus: false,
    },
  });

  const { data: onChainIdentifier } = useReadContract({
    address: verifiedListAddress,
    abi: NILCC_VERIFIED_LIST_ABI,
    functionName: 'getIdentifier',
    args: verifiedListArgs,
    query: {
      enabled: Boolean(walletAddress && onChainVerificationData),
      refetchOnWindowFocus: false,
    },
  });

  const isOnChainVerified = Boolean(onChainVerificationData);

  const createRequest = async () => {
    if (!authenticated) {
      login();
      return;
    }

    if (!walletAddress) {
      setMessage('No wallet found. Please connect a wallet in Privy.');
      return;
    }

    if (isOnChainVerified && !allowReverificationFlow) {
      setMessage(
        'Your wallet is already on the NilccVerifiedList. No further action needed.'
      );
      return;
    }

    const zkPassport = await loadZkPassport();
    if (!zkPassport) {
      setMessage('Unable to initialize ZKPassport.');
      return;
    }

    setIsOver18(undefined);
    setUniqueIdentifier('');
    setVerified(undefined);
    setBackendVerified(undefined);
    setQueryUrl('');
    setMessage(
      'Scan the QR code with your camera to start the zkPassport verification process...'
    );

    try {
      const queryBuilder = await zkPassport.request({
        name: 'Buyer Verification',
        logo: 'https://zkpassport.id/favicon.png',
        purpose: 'Verify you meet product requirements',
        scope: 'buyer-verification',
        mode: 'fast',
        devMode: true,
      });

      const {
        url,
        onRequestReceived,
        onGeneratingProof,
        onProofGenerated,
        onResult,
        onReject,
        onError,
      } = queryBuilder.gte('age', 18).done();

      setQueryUrl(url);
      setRequestInProgress(true);

      const proofs: ProofResult[] = [];

      onRequestReceived(() => {
        setMessage('Request received. Waiting for proof...');
      });

      onGeneratingProof(() => {
        setMessage('Generating proof...');
      });

      onProofGenerated((result: ProofResult) => {
        proofs.push(result);
        setMessage(
          `Generated ${proofs.length} proof${proofs.length > 1 ? 's' : ''}...`
        );
      });

      onResult(async ({ result, uniqueIdentifier, verified }) => {
        setIsOver18(result?.age?.gte?.result);
        setUniqueIdentifier(uniqueIdentifier || '');
        setVerified(verified);
        console.log('[Verification] Proof payload:', {
          result,
          uniqueIdentifier,
          verified,
          proofs,
        });

        if (allowReverificationFlow) {
          setMessage(
            'Proof verified locally. Since you are already on-chain, no backend call was made.'
          );
          setRequestInProgress(false);
          setAllowReverificationFlow(false);
          return;
        }

        setMessage('Proof received. Sending to backend...');

        try {
          const response = await fetch('/api/user-verification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              queryResult: result,
              proofs,
              domain:
                typeof window !== 'undefined'
                  ? window.location.hostname
                  : 'localhost',
              walletAddress,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data) {
            const errorMessage =
              (data && data.error) || 'Backend verification failed';
            setMessage(`Backend error: ${errorMessage}`);
            setBackendVerified(false);
          } else {
            setBackendVerified(Boolean(data?.registered));
            setMessage(
              data?.registered
                ? '✅ Backend verified your proof!'
                : '❌ Backend verification failed.'
            );
          }
        } catch (error) {
          console.error('Backend verification error', error);
          setMessage(
            `Error contacting backend: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        } finally {
          setRequestInProgress(false);
        }
      });

      onReject(() => {
        setMessage('User rejected the request.');
        setRequestInProgress(false);
      });

      onError((error) => {
        console.error('ZKPassport error', error);
        setMessage('An error occurred while generating the proof.');
        setRequestInProgress(false);
      });
    } catch (error) {
      console.error('Failed to create request', error);
      setMessage('Failed to create verification request.');
      setRequestInProgress(false);
    }
  };

  const formattedIdentifier =
    typeof onChainIdentifier === 'bigint'
      ? onChainIdentifier.toString()
      : undefined;

  const renderContent = () => {
    if (!authenticated) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            textAlign: 'center',
          }}
        >
          <p className="hero-label">User Verification</p>
          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: 300,
              letterSpacing: '-0.01em',
            }}
          >
            Sign in to continue.
          </h1>
          <p
            style={{
              maxWidth: '26rem',
              color: '#666',
              fontFamily: 'var(--font-inter)',
            }}
          >
            Buyer verification requires a Privy session so we can link your
            wallet address to the resulting proof.
          </p>
          <button onClick={login} className="btn-primary">
            Sign in with Privy
          </button>
        </div>
      );
    }

    if (!walletAddress) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 300,
              letterSpacing: '-0.01em',
            }}
          >
            Link a wallet to verify.
          </h1>
          <p
            style={{
              maxWidth: '28rem',
              color: '#666',
              fontFamily: 'var(--font-inter)',
            }}
          >
            Add or unlock a wallet inside the Privy modal so we can associate
            proofs with your buyer identity.
          </p>
          <button onClick={login} className="btn-secondary">
            Manage Privy Session
          </button>
        </div>
      );
    }

    if (walletAddress && isLoadingOnChain) {
      return (
        <div
          style={{
            minHeight: '50vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '3px solid #D97757',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }}
          ></div>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              color: '#666',
            }}
          >
            Checking NilccVerifiedList for your wallet...
          </p>
        </div>
      );
    }

    if (walletAddress && isOnChainVerified && !allowReverificationFlow) {
      return (
        <div
          className="container-eclipse"
          style={{
            paddingTop: '6rem',
            paddingBottom: '4rem',
            maxWidth: '700px',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              backgroundColor: '#f4fbf6',
              border: '1px solid #bce3c6',
              borderRadius: '1.5rem',
              padding: '3rem 2rem',
              boxShadow: '0 25px 60px rgba(20, 83, 45, 0.08)',
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h1
              style={{
                fontSize: '2.25rem',
                fontWeight: 300,
                marginBottom: '1rem',
              }}
            >
              Already verified on NilccVerifiedList
            </h1>
            <p
              style={{
                color: '#365B3E',
                fontFamily: 'var(--font-inter)',
                marginBottom: '1.5rem',
              }}
            >
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)} is already
              registered on-chain, so you can purchase products that require
              verification without re-running the proof flow.
            </p>
            {formattedIdentifier && (
              <div
                style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  backgroundColor: '#fff',
                  border: '1px solid #d5f0dd',
                  borderRadius: '1rem',
                  padding: '1rem 1.5rem',
                  margin: '0 auto 1.5rem',
                  maxWidth: '420px',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#6b7280',
                    marginBottom: '.25rem',
                  }}
                >
                  Identifier
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    wordBreak: 'break-all',
                    lineHeight: 1.35,
                    textAlign: 'center',
                  }}
                  title={formattedIdentifier}
                >
                  {formattedIdentifier}
                </span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                alignItems: 'center',
              }}
            >
              <button
                onClick={() => refetchOnChainStatus()}
                className="btn-secondary"
                style={{ width: '100%' }}
              >
                Refresh status
              </button>
              <button
                onClick={() => {
                  setAllowReverificationFlow(true);
                  setIsOver18(undefined);
                  setUniqueIdentifier('');
                  setVerified(undefined);
                  setBackendVerified(undefined);
                  setQueryUrl('');
                  setMessage(
                    'You can re-run the proof flow without updating on-chain status.'
                  );
                }}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                Verify Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="container-eclipse"
        style={{
          paddingTop: '6rem',
          paddingBottom: '4rem',
          maxWidth: '900px',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '2rem',
          }}
        >
          <div className="hero-label" style={{ marginBottom: '.75rem' }}>
            Buyer Verification
          </div>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 300,
              lineHeight: 1.15,
            }}
          >
            Prove eligibility without revealing data.
          </h1>
          <p
            style={{
              color: '#666',
              marginTop: '.75rem',
              fontFamily: 'var(--font-inter)',
            }}
          >
            Generate a ZKPassport proof to verify your eligibility to buy
            products.
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(10,10,10,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: '0.75rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#999',
                  marginBottom: '.25rem',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                Connected wallet
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}
              >
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            </div>
            <button
              onClick={createRequest}
              disabled={requestInProgress}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: requestInProgress ? '#e0e0e0' : '#1a1a1a',
                color: requestInProgress ? '#666' : '#fafaf8',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: requestInProgress ? 'not-allowed' : 'pointer',
                transition: 'all 200ms',
              }}
            >
              {requestInProgress ? 'Waiting for proof...' : 'Generate Request'}
            </button>
          </div>

          {queryUrl && (
            <div
              style={{
                alignSelf: 'center',
                padding: '1rem',
                backgroundColor: '#fafaf8',
                borderRadius: '1rem',
                border: '1px dashed #e0e0e0',
              }}
            >
              <QRCode value={queryUrl} size={200} />
            </div>
          )}

          {message && (
            <div
              style={{
                backgroundColor: '#fdf4ec',
                border: '1px solid #f5d6ba',
                borderRadius: '.75rem',
                padding: '1rem',
                fontFamily: 'var(--font-inter)',
                color: '#9a3412',
              }}
            >
              {message}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <VerificationStat
              label="Age ≥ 18"
              value={
                isOver18 === undefined
                  ? 'Waiting'
                  : isOver18
                  ? 'Verified'
                  : 'Rejected'
              }
            />
            <VerificationStat
              label="SDK Result"
              value={
                verified === undefined
                  ? 'Pending'
                  : verified
                  ? '✅ Verified'
                  : '❌ Failed'
              }
            />
            <VerificationStat
              label="Backend Result"
              value={
                backendVerified === undefined
                  ? 'Pending'
                  : backendVerified
                  ? '✅ Registered'
                  : '❌ Failed'
              }
            />
          </div>

          {uniqueIdentifier && (
            <div
              style={{
                backgroundColor: '#fafaf8',
                borderRadius: '.75rem',
                padding: '1rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.8125rem',
              }}
            >
              <p
                style={{
                  fontWeight: 600,
                  marginBottom: '.5rem',
                  color: '#444',
                }}
              >
                Unique Identifier
              </p>
              <p style={{ wordBreak: 'break-all', color: '#555' }}>
                {uniqueIdentifier}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      {renderContent()}
    </>
  );
}

function VerificationStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: '.75rem',
        padding: '1rem',
        backgroundColor: '#fafaf8',
      }}
    >
      <p
        style={{
          fontSize: '0.75rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#999',
          marginBottom: '.5rem',
          fontFamily: 'var(--font-inter)',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: '#1a1a1a',
          fontFamily: 'var(--font-inter)',
        }}
      >
        {value}
      </p>
    </div>
  );
}
