import React from "react";
import { notFound } from "next/navigation";
import FluteStudio from "../../src/flute/Studio";
export default function FlutePage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <><meta name="flute-project" content="0ebf8276-49ba-4275-9242-6caca260bca1" /><FluteStudio /></>;
}
