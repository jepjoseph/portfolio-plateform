export function buildResumeSummaryContext(profile, resumeDraft) {
  const professionalTitle =
    (profile.professionalTitles || []).find(
      (title) => title.id === resumeDraft.headerSelections.professionalTitleId,
    ) || null;

  return {
    documentType: "resume",
    targetRole: resumeDraft.targetRole.trim(),
    template: resumeDraft.template,

    professionalTitle: professionalTitle?.name?.trim() || "",

    skills: (resumeDraft.skills || [])
      .map((skill) => skill.name || skill.value || skill)
      .filter(Boolean),

    experiences: (resumeDraft.experiences || []).map((experience) => ({
      position:
        experience.position || experience.title || experience.role || "",

      company: experience.company || experience.organization || "",

      description: experience.description || "",

      achievements:
        experience.achievements || experience.responsibilities || [],
    })),

    projects: (resumeDraft.projects || []).map((project) => ({
      name: project.name || project.title || "",
      description: project.description || "",
      technologies: project.technologies || [],
    })),

    education: (resumeDraft.education || []).map((item) => ({
      degree: item.degree || item.program || "",
      fieldOfStudy: item.fieldOfStudy || "",
      institution: item.institution || item.school || "",
    })),

    certifications: (resumeDraft.certifications || []).map((certification) => ({
      name: certification.name || "",
      organization:
        certification.issuingOrganization || certification.organization || "",
    })),

    existingSummary: resumeDraft.summary.trim(),
  };
}
