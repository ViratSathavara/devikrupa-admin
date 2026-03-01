import namer from "color-namer";

export const getColorNameFromHex = (hex: string): string => {
  try {
    const result = namer(hex, { pick: ["basic"] });
    return result.basic[0]?.name || "Custom Color";
  } catch {
    return "Custom Color";
  }
};
