// A view of owner-scoped Training records already loaded by TrainingDataContext.
// Never persist this projection as Certification metadata.
export function projectCertificationTrainingRelationships(certifications, trainingRecords) {
  const linksByCertification = new Map();
  const seenTrainingIds = new Set();
  for (const training of Array.isArray(trainingRecords) ? trainingRecords : []) {
    if (typeof training?.id !== "string" || !training.id || seenTrainingIds.has(training.id)) continue;
    seenTrainingIds.add(training.id);
    const seenCertificationIds = new Set();
    for (const relationship of Array.isArray(training.certificationRelationships) ? training.certificationRelationships : []) {
      const certificationId = relationship?.certificationId || relationship?.certificationRecordId;
      if (typeof certificationId !== "string" || !certificationId || seenCertificationIds.has(certificationId)) continue;
      seenCertificationIds.add(certificationId);
      const links = linksByCertification.get(certificationId) || [];
      links.push({
        id: `training-reference:${training.id}`,
        trainingId: training.id,
        order: links.length,
        snapshot: {
          title: training.title || "Untitled Training",
          providerName: training.provider?.name || "",
          completionStatus: training.completion?.status || "",
        },
        trainingStatus: training.status || "active",
      });
      linksByCertification.set(certificationId, links);
    }
  }
  return (Array.isArray(certifications) ? certifications : []).map((certification) => ({
    ...certification,
    relatedRecords: {
      ...certification.relatedRecords,
      // Do not merge legacy snapshots: they can resurrect an unlinked Training.
      trainingRelationships: linksByCertification.get(certification.id) || [],
    },
  }));
}
