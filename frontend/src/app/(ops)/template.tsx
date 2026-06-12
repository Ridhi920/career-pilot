"use client";

import { motion } from "framer-motion";

/** Quick fade on navigation — nothing fancier. */
export default function OpsTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      {children}
    </motion.div>
  );
}
