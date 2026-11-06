// Signatures of the retired B2 curriculum drafts. Custom teacher edits are preserved.
const retired = {
  "B2-1.1": "716:58bfba66",
  "B2-1.2": "682:43b33920",
  "B2-1.3": "717:07d43e16",
  "B2-1.4": "721:72acfb24",
  "B2-2.5": "609:3d34e8e6",
  "B2-2.6": "661:fe2a46f1",
  "B2-2.7": "736:249fbebc",
  "B2-2.8": "646:db78e54c",
  "B2-3.9": "701:78ee9223",
  "B2-3.10": "714:530d526c",
  "B2-3.11": "629:7f012775",
  "B2-3.12": "596:ae0b56c8",
  "B2-4.13": "646:802584af",
  "B2-4.14": "653:9ee4b4e4",
  "B2-4.15": "614:dff9001a",
  "B2-4.16": "617:246e09da",
  "B2-5.17": "601:cee06c5a",
  "B2-5.18": "616:a9cd6703",
  "B2-5.19": "589:41a7704e",
  "B2-5.20": "622:b0d31501",
  "B2-6.21": "600:67d64969",
  "B2-6.22": "616:7886172e",
  "B2-6.23": "652:cfba223b",
  "B2-6.24": "613:eca690ab",
  "B2-7.25": "615:6e09f4be",
  "B2-7.26": "569:5b96f3ab",
  "B2-7.27": "639:dd562024",
  "B2-7.28": "607:5fca5e7d"
};
export function isRetiredAdvancedMusicDraft(key, lyrics) {
  const text = String(lyrics || "").trim().replace(/\r\n/g, "\n");
  let hash = 2166136261;
  for (const character of text) hash = Math.imul(hash ^ character.codePointAt(0), 16777619) >>> 0;
  return retired[key] === `${text.length}:${hash.toString(16).padStart(8, "0")}`;
}
