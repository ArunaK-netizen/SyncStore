"use client";
import React from "react";
import dynamic from "next/dynamic";
const Preview = process.env.NODE_ENV === "development" ? dynamic(() => import("./ProjectPreview").then(m => m.FluteProjectPreview), { ssr: false }) : () => null;
export default function FluteStudio() {
  return <Preview enabled={process.env.NODE_ENV === "development"} active />;
}
