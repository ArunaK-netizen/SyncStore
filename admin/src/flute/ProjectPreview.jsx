"use client";
import React from "react";
import { ProjectPreview } from "@webprodigies/flute/preview";
import { sceneModules } from "./catalog";
// Host-owned development flag: no process, Vite or Electron globals in this adapter.
export function FluteProjectPreview({ children, enabled, active, ...props }) {
  if (!enabled) return children;
  return <ProjectPreview {...props} projectId="0ebf8276-49ba-4275-9242-6caca260bca1" enabled={enabled} active={active} sceneModules={sceneModules}>{children}</ProjectPreview>;
}
