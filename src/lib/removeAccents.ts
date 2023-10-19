export const removeAccents = (str?: string) =>
  (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u2010-\u2015]/g, " ")
    .replace(/st /g, "saint ")
    .replace(/ and /g, " ")
    .replace(/ & /g, " ")
    .replace(/ste /g, "sainte ")
    .replace(/cdg/g, "charles de gaulle")
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .replace(/\s+/g, " ");

export default removeAccents;
