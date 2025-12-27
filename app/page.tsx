
"use client";

import React from 'react';
import ChatDashboard from '../pages/ChatDashboard';
import { useAuth } from './providers';

export default function Page() {
  const { user, activeWorkspace } = useAuth();
  
  if (!user || !activeWorkspace) return null;
  
  return <ChatDashboard user={user} workspace={activeWorkspace} />;
}
