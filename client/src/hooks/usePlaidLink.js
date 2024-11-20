// usePlaidLink.js
import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink as useOriginalPlaidLink } from 'react-plaid-link';
import PlaidAPI from '../api/plaidApi';
import { useAuth } from '../contexts/AuthContext';

export const usePlaidLink = (onSuccess) => {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Get link token on mount
  useEffect(() => {
    const getLinkToken = async () => {
      try {
        setLoading(true);
        const token = await PlaidAPI.createLinkToken();
        setLinkToken(token);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to get link token');
        console.error('Error getting link token:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      getLinkToken();
    }
  }, [user]);

  const onPlaidSuccess = useCallback(async (publicToken, metadata) => {
    try {
      setLoading(true);
      // Exchange public token for access token
      const exchangeResult = await PlaidAPI.exchangePublicToken(publicToken);
      
      // Handle successful account linking
      if (onSuccess) {
        await onSuccess(exchangeResult, metadata);
      }
      
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to link account');
      console.error('Error linking account:', err);
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  const config = {
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err, metadata) => {
      if (err != null) {
        setError(err.message || 'Error during Plaid Link exit');
      }
    },
  };

  const { open, ready, error: plaidError } = useOriginalPlaidLink(config);

  // Automatically open Plaid Link when token is ready
  useEffect(() => {
    if (ready && linkToken) {
      open();
    }
  }, [ready, linkToken, open]);

  return {
    open,
    ready,
    loading,
    error: error || plaidError,
    linkToken,
  };
};