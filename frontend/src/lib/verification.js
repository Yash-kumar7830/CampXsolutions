import stringSimilarity from 'string-similarity';
/**
 * Verifies a claim by comparing the loser's answer against the finder's hidden detail.
 * @param loserAnswer The text provided by the claimant.
 * @param finderHiddenDetail The secret detail provided by the finder.
 * @returns A similarity score (0 to 1) and a boolean indicating if it's a match.
 */
export const verifyClaim = (loserAnswer, finderHiddenDetail) => {
    // Normalize text for better comparison (lowercase, trim whitespace)
    const normalizedLoserAnswer = loserAnswer.toLowerCase().trim();
    const normalizedFinderHiddenDetail = finderHiddenDetail.toLowerCase().trim();
    const similarity = stringSimilarity.compareTwoStrings(normalizedLoserAnswer, normalizedFinderHiddenDetail);
    // Define a threshold for a successful match
    const MATCH_THRESHOLD = 0.7; // Can be adjusted based on desired strictness
    return {
        score: similarity,
        isMatch: similarity >= MATCH_THRESHOLD,
    };
};
/**
 * Redacts sensitive keywords in a description for public display.
 * This is a client-side simulation. In a real app, sensitive data should not be sent to the client unredacted.
 * @param description The original item description.
 * @param keywordsToRedact An array of keywords to replace with '[REDACTED]'.
 * @returns The redacted description.
 */
export const redactDescription = (description, keywordsToRedact = ['serial number', 'id card', 'credit card', 'phone number', 'email', 'address']) => {
    let redactedText = description;
    keywordsToRedact.forEach(keyword => {
        // Use a regex with global and case-insensitive flags
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        redactedText = redactedText.replace(regex, '[REDACTED]');
    });
    return redactedText;
};
