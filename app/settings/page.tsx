
"use client";

import React from 'react';
import Settings from '../../pages/Settings';
import { useAuth } from '../providers';

export default function Page() {
  const { user, activeWorkspace } = useAuth();
  
  if (!user || !activeWorkspace) return null;
  
  return <Settings user={user} workspace={activeWorkspace} />;
}
