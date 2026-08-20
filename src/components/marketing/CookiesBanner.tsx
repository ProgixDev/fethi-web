"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "mystreet:cookies";

export function CookiesBanner() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (!v) setVisible(true);
  }, []);

  function decide(value: "accept" | "decline") {
    window.localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-4 z-40 px-4"
          data-lenis-prevent
        >
          <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-3 rounded-xl border border-n-100 bg-surface p-4 shadow-strong sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="text-body-sm font-medium text-ink">
                Cookies essentiels uniquement.
              </p>
              <p className="text-caption text-n-500">
                On n&apos;utilise aucun cookie de mesure d&apos;audience ni de
                publicité — juste ce qu&apos;il faut pour vous garder connecté.{" "}
                <Link
                  href="/cookies"
                  className="text-primary hover:underline underline-offset-2"
                >
                  En savoir plus
                </Link>
                .
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => decide("decline")}>
                Refuser
              </Button>
              <Button size="sm" onClick={() => decide("accept")}>
                Accepter
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
