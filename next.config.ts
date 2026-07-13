import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: [
    "@heroui/react",
    "@heroui/styles",
    "@react-aria/ssr",
    "@react-aria/i18n",
    "@react-aria/utils",
    "@react-types/shared",
    "@react-types/color",
    "@react-stately/utils",
    "@internationalized/date",
    "@internationalized/number",
    "@internationalized/string",
    "@radix-ui/react-avatar",
    "react-aria",
    "react-aria-components",
    "framer-motion",
    "tailwind-variants",
    "tailwind-merge",
    "input-otp",
    "@jridgewell/sourcemap-codec",
    "@jridgewell/trace-mapping",
    "@jridgewell/remapping",
    "@jridgewell/gen-mapping",
    "@jridgewell/resolve-uri",
    "@jridgewell/set-array",
    "@cspotcode/source-map-support",
  ],
}

export default nextConfig
