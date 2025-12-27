
"use client";

import React from 'react';
import DocumentLibrary from '../../pages/DocumentLibrary';
import { useAuth } from '../providers';

export default function Page() {
  const { user, activeWorkspace } = useAuth();
  
  if (!user || !activeWorkspace) return null;
  
  return <DocumentLibrary user={user} workspace={activeWorkspace} />;
}
