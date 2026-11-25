export function adaptPublicSnapshot(snapshot) {
  if (snapshot?.schemaVersion !== 1 || !Array.isArray(snapshot.sections)) return null;
  const keys = ["profile", "summary", "projects", "experience", "education", "skills", "certifications", "training", "resume"];
  const sectionVisibility = Object.fromEntries(keys.map(key => [key, key !== "resume" && snapshot.sections.some(s => s.sectionKey === key && s.isVisible === true)]));
  const list = (key, field) => sectionVisibility[key] && Array.isArray(snapshot[field]) ? snapshot[field] : [];
  const profile = sectionVisibility.profile ? snapshot.selectedProfile || {} : {};
  const text = value => typeof value === "string" ? value : "";
  return {
    portfolioName: text(snapshot.title),
    purpose: snapshot.purpose, professionalField: snapshot.professionalField, style: snapshot.style,
    sectionVisibility,
    selectedProfile: { selectedName: text(profile.displayName) || [text(profile.firstName), text(profile.lastName)].filter(Boolean).join(" "), professionalTitles: text(profile.professionalTitle) ? [{name: profile.professionalTitle}] : [] },
    heroSettings: sectionVisibility.profile ? {...snapshot.heroSettings, portfolioStyle: snapshot.style} : {},
    about: sectionVisibility.summary ? {text: text(snapshot.about?.text)} : {},
    projects: list("projects", "projects"), experiences: list("experience", "experiences"), education: list("education", "education"), skills: list("skills", "skills"), certifications: list("certifications", "certifications"), trainings: list("training", "trainings"),
  };
}
