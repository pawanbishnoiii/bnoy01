export type ParsedUA = { deviceType: string; deviceName: string; os: string; browser: string };

/** Lightweight user-agent parser for visitor analytics. */
export function parseUserAgent(ua: string): ParsedUA {
  const u = ua || "";
  let os = "Unknown";
  let m: RegExpMatchArray | null;
  if ((m = u.match(/Windows NT ([\d.]+)/))) os = `Windows ${({ "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7" } as Record<string, string>)[m[1]] ?? m[1]}`;
  else if ((m = u.match(/Android ([\d.]+)/))) os = `Android ${m[1]}`;
  else if ((m = u.match(/(iPhone|iPad); CPU (?:iPhone )?OS ([\d_]+)/))) os = `iOS ${m[2].replace(/_/g, ".")}`;
  else if ((m = u.match(/Mac OS X ([\d_]+)/))) os = `macOS ${m[1].replace(/_/g, ".")}`;
  else if (/CrOS/.test(u)) os = "ChromeOS";
  else if (/Linux/.test(u)) os = "Linux";

  let browser = "Unknown";
  if ((m = u.match(/Edg\/([\d]+)/))) browser = `Edge ${m[1]}`;
  else if ((m = u.match(/OPR\/([\d]+)/))) browser = `Opera ${m[1]}`;
  else if ((m = u.match(/SamsungBrowser\/([\d]+)/))) browser = `Samsung Internet ${m[1]}`;
  else if ((m = u.match(/Firefox\/([\d]+)/))) browser = `Firefox ${m[1]}`;
  else if ((m = u.match(/Chrome\/([\d]+)/))) browser = `Chrome ${m[1]}`;
  else if ((m = u.match(/Version\/([\d]+).*Safari/))) browser = `Safari ${m[1]}`;
  if (/bot|crawler|spider|crawling/i.test(u)) browser = `Bot (${(u.match(/(\w*bot\w*)/i) || ["", "bot"])[1]})`;

  const isTablet = /iPad|Tablet/i.test(u) || (/Android/.test(u) && !/Mobile/.test(u));
  const isMobile = !isTablet && /Mobi|iPhone|Android/i.test(u);
  const deviceType = /bot|crawler|spider/i.test(u) ? "bot" : isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  let deviceName = deviceType === "desktop" ? os.split(" ")[0] + " PC" : "Unknown";
  if (/iPhone/.test(u)) deviceName = "iPhone";
  else if (/iPad/.test(u)) deviceName = "iPad";
  else if (/Macintosh/.test(u)) deviceName = "Mac";
  else if ((m = u.match(/Android [\d.]+; ([^;)]+?)(?: Build|\))/))) deviceName = m[1].trim() === "K" ? "Android device" : m[1].trim();
  return { deviceType, deviceName, os, browser };
}
