
"use client";

import React from 'react';
import AuthScreen from '../../pages/AuthScreen';
import { useAuth } from '../providers';
import { useNavigate } from 'react-router-dom';

export default function Page() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  return <AuthScreen onLogin={login} />;
}
