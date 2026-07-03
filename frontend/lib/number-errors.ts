export const NumberErrorCodes = {
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  SERVICE_PRICING_UNAVAILABLE: "SERVICE_PRICING_UNAVAILABLE",
  TOO_MANY_NUMBER_OPERATIONS: "TOO_MANY_NUMBER_OPERATIONS",
} as const;

export function getNumberFlowErrorMessage(error?: string | null): string | null {
  if (!error) return null;
  if (error === NumberErrorCodes.SERVICE_PRICING_UNAVAILABLE) {
    return "Pricing is temporarily unavailable. Please try again shortly.";
  }
  if (error === NumberErrorCodes.TOO_MANY_NUMBER_OPERATIONS) {
    return "Please wait 60 seconds before requesting another number.";
  }
  if (error === "Please wait a moment before requesting another number.") {
    return "Please wait about 60 seconds before getting another number.";
  }
  return null;
}
