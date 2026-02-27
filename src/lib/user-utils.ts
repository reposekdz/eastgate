/**
 * User Utility Functions
 * Extract names and generate avatars from email addresses
 */

/**
 * Extract name from email address
 * Examples:
 * - john.doe@eastgate.rw -> John Doe
 * - grace@eastgate.rw -> Grace
 * - jp@eastgate.rw -> JP
 */
export function extractNameFromEmail(email: string): string {
  if (!email) return "User";
  
  // Get the part before @
  const username = email.split("@")[0];
  
  // Split by dots, underscores, or hyphens
  const parts = username.split(/[._-]/);
  
  // Capitalize each part
  const capitalizedParts = parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  );
  
  return capitalizedParts.join(" ");
}

/**
 * Generate initials from name or email
 * Examples:
 * - John Doe -> JD
 * - Grace -> G
 * - john.doe@eastgate.rw -> JD
 */
export function generateInitials(nameOrEmail: string): string {
  if (!nameOrEmail) return "U";
  
  // If it's an email, extract name first
  const name = nameOrEmail.includes("@") 
    ? extractNameFromEmail(nameOrEmail) 
    : nameOrEmail;
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Generate avatar color based on email/name
 * Consistent color for same email
 */
export function generateAvatarColor(text: string): string {
  if (!text) return "#10b981"; // emerald
  
  const colors = [
    "#10b981", // emerald
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#f59e0b", // amber
    "#ef4444", // red
    "#06b6d4", // cyan
    "#ec4899", // pink
    "#84cc16", // lime
  ];
  
  // Generate hash from text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get user display info from email
 */
export function getUserDisplayInfo(email: string, name?: string) {
  const displayName = name || extractNameFromEmail(email);
  const initials = generateInitials(displayName);
  const avatarColor = generateAvatarColor(email);
  
  return {
    displayName,
    initials,
    avatarColor,
    email,
  };
}
