// Measurement templates: which outfits a designer can record for each gender,
// and which body measurements each outfit needs. Served to the frontend via
// GET /measurements/templates so the form is never hardcoded there, and used
// here to validate saved records. Add a garment or field here, no migration.

export type MeasurementGroup = "UPPER_BODY" | "ARMS" | "LOWER_BODY" | "LENGTHS";

export interface MeasurementField {
  key: string;
  label: string;
  group: MeasurementGroup;
  hint: string;
}

export interface GarmentTemplate {
  value: string;
  label: string;
  fields: string[];
}

const FIELDS: Record<string, MeasurementField> = {
  neck: { key: "neck", label: "Neck", group: "UPPER_BODY", hint: "Round the base of the neck" },
  shoulder: { key: "shoulder", label: "Shoulder", group: "UPPER_BODY", hint: "Shoulder tip to shoulder tip, across the back" },
  chest: { key: "chest", label: "Chest", group: "UPPER_BODY", hint: "Round the fullest part of the chest" },
  bust: { key: "bust", label: "Bust", group: "UPPER_BODY", hint: "Round the fullest part of the bust" },
  underBust: { key: "underBust", label: "Under bust", group: "UPPER_BODY", hint: "Round the ribcage, just under the bust" },
  bustPoint: { key: "bustPoint", label: "Bust point", group: "UPPER_BODY", hint: "Nipple to nipple" },
  shoulderToBustPoint: { key: "shoulderToBustPoint", label: "Shoulder to bust point", group: "UPPER_BODY", hint: "Shoulder down to the nipple" },
  shoulderToUnderBust: { key: "shoulderToUnderBust", label: "Shoulder to under bust", group: "UPPER_BODY", hint: "Shoulder down to under the bust" },
  shoulderToWaist: { key: "shoulderToWaist", label: "Shoulder to waist", group: "UPPER_BODY", hint: "Shoulder down to the natural waist" },
  stomach: { key: "stomach", label: "Stomach", group: "UPPER_BODY", hint: "Round the belly, at the navel" },
  waist: { key: "waist", label: "Waist", group: "LOWER_BODY", hint: "Round the natural waist" },
  hip: { key: "hip", label: "Hip", group: "LOWER_BODY", hint: "Round the fullest part of the hips" },
  thigh: { key: "thigh", label: "Thigh", group: "LOWER_BODY", hint: "Round the fullest part of the thigh" },
  knee: { key: "knee", label: "Knee", group: "LOWER_BODY", hint: "Round the knee" },
  ankle: { key: "ankle", label: "Ankle / Bottom", group: "LOWER_BODY", hint: "Trouser opening at the ankle" },
  crotch: { key: "crotch", label: "Crotch / Inseam", group: "LOWER_BODY", hint: "Crotch down to the ankle, inside leg" },
  sleeveLength: { key: "sleeveLength", label: "Sleeve length", group: "ARMS", hint: "Shoulder tip down to the wrist" },
  shortSleeve: { key: "shortSleeve", label: "Short sleeve length", group: "ARMS", hint: "Shoulder tip to just above the elbow" },
  roundSleeve: { key: "roundSleeve", label: "Round sleeve (bicep)", group: "ARMS", hint: "Round the fullest part of the upper arm" },
  armhole: { key: "armhole", label: "Armhole", group: "ARMS", hint: "Round the armpit and shoulder joint" },
  wrist: { key: "wrist", label: "Wrist / Cuff", group: "ARMS", hint: "Round the wrist" },
  blouseLength: { key: "blouseLength", label: "Blouse length", group: "LENGTHS", hint: "Shoulder down to where the blouse ends" },
  topLength: { key: "topLength", label: "Top length", group: "LENGTHS", hint: "Shoulder down to where the top ends" },
  jacketLength: { key: "jacketLength", label: "Jacket length", group: "LENGTHS", hint: "Back of the neck down to the jacket hem" },
  agbadaLength: { key: "agbadaLength", label: "Agbada length", group: "LENGTHS", hint: "Shoulder down to the agbada hem" },
  gownLength: { key: "gownLength", label: "Gown length", group: "LENGTHS", hint: "Shoulder down to the hem" },
  skirtLength: { key: "skirtLength", label: "Skirt / Wrapper length", group: "LENGTHS", hint: "Waist down to the hem" },
  trouserLength: { key: "trouserLength", label: "Trouser length", group: "LENGTHS", hint: "Waist down to the ankle" },
  fullLength: { key: "fullLength", label: "Full length", group: "LENGTHS", hint: "Shoulder down to the floor" },
  capSize: { key: "capSize", label: "Cap size (head)", group: "UPPER_BODY", hint: "Round the head, above the ears" },
};

const FEMALE_TOP = ["bust", "underBust", "shoulder", "bustPoint", "shoulderToBustPoint", "shoulderToUnderBust", "sleeveLength", "roundSleeve", "armhole"];
const MALE_TOP = ["neck", "chest", "stomach", "shoulder", "sleeveLength", "roundSleeve", "wrist", "topLength"];
const TROUSER = ["waist", "hip", "thigh", "knee", "ankle", "crotch", "trouserLength"];

const unique = (keys: string[]) => [...new Set(keys)];

export const GARMENTS: Record<"MALE" | "FEMALE", GarmentTemplate[]> = {
  FEMALE: [
    { value: "GOWN", label: "Gown / Dress", fields: unique([...FEMALE_TOP, "shoulderToWaist", "waist", "hip", "gownLength"]) },
    { value: "BLOUSE", label: "Blouse / Top", fields: unique(["neck", ...FEMALE_TOP, "waist", "blouseLength"]) },
    { value: "SKIRT", label: "Skirt", fields: ["waist", "hip", "skirtLength"] },
    { value: "SKIRT_AND_BLOUSE", label: "Skirt & Blouse", fields: unique([...FEMALE_TOP, "waist", "hip", "blouseLength", "skirtLength"]) },
    { value: "IRO_AND_BUBA", label: "Iro & Buba", fields: unique(["bust", "shoulder", "sleeveLength", "roundSleeve", "blouseLength", "waist", "hip", "skirtLength"]) },
    { value: "TROUSERS", label: "Trousers", fields: TROUSER },
    { value: "JUMPSUIT", label: "Jumpsuit", fields: unique(["bust", "shoulder", "sleeveLength", "roundSleeve", ...TROUSER, "fullLength"]) },
    { value: "KAFTAN", label: "Kaftan / Bubu", fields: ["bust", "shoulder", "sleeveLength", "roundSleeve", "hip", "fullLength"] },
    { value: "FULL_BODY", label: "Full body (everything)", fields: [] },
  ],
  MALE: [
    { value: "SHIRT", label: "Shirt", fields: unique([...MALE_TOP, "shortSleeve"]) },
    { value: "SENATOR", label: "Senator / Kaftan", fields: unique([...MALE_TOP, ...TROUSER]) },
    { value: "AGBADA", label: "Agbada", fields: unique([...MALE_TOP, "agbadaLength", ...TROUSER, "capSize"]) },
    { value: "BUBA_AND_SOKOTO", label: "Buba & Sokoto", fields: unique([...MALE_TOP, ...TROUSER, "capSize"]) },
    { value: "SUIT", label: "Suit / Blazer", fields: unique(["neck", "chest", "stomach", "shoulder", "sleeveLength", "roundSleeve", "wrist", "jacketLength", ...TROUSER]) },
    { value: "TROUSERS", label: "Trousers", fields: TROUSER },
    { value: "FULL_BODY", label: "Full body (everything)", fields: [] },
  ],
};

// "Full body" gets every field the other garments of that gender use.
for (const gender of ["MALE", "FEMALE"] as const) {
  const full = GARMENTS[gender].find((g) => g.value === "FULL_BODY")!;
  full.fields = unique(GARMENTS[gender].flatMap((g) => g.fields));
}

export const OCCASIONS = [
  "Wedding",
  "Owambe / Party",
  "Traditional ceremony",
  "Church / Mosque",
  "Office / Work",
  "Casual",
  "Birthday",
  "Graduation",
  "Other",
];

export function getGarment(gender: "MALE" | "FEMALE", garmentType: string) {
  return GARMENTS[gender].find((g) => g.value === garmentType) ?? null;
}

export function getTemplates() {
  return {
    fields: FIELDS,
    garments: GARMENTS,
    groups: [
      { value: "UPPER_BODY", label: "Upper body" },
      { value: "ARMS", label: "Arms" },
      { value: "LOWER_BODY", label: "Lower body" },
      { value: "LENGTHS", label: "Lengths" },
    ],
    genders: [
      { value: "FEMALE", label: "Female" },
      { value: "MALE", label: "Male" },
    ],
    units: [
      { value: "INCH", label: "Inches", symbol: "in" },
      { value: "CM", label: "Centimetres", symbol: "cm" },
    ],
    fits: [
      { value: "SLIM", label: "Slim fit" },
      { value: "REGULAR", label: "Regular fit" },
      { value: "LOOSE", label: "Loose fit" },
    ],
    occasions: OCCASIONS,
  };
}
