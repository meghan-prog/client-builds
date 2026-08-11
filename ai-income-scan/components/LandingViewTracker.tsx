"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function LandingViewTracker() {
  useEffect(() => {
    trackEvent("landing_view");
  }, []);

  return null;
}
