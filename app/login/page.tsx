
"use client";

import React from 'react';
import AuthScreen from '../../pages/AuthScreen';
import { useAuth } from '../providers';

export default function Page() {
  const { login, user, push } = useAuth();

  React.useEffect(() => {
    if (user) push('/');
  }, [user]);

  return <AuthScreen onLogin={login} />;
}
