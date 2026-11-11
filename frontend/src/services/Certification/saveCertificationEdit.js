// Keeps file uploads on the dedicated endpoint, outside metadata PATCH.
export async function saveCertificationEdit({ existing, updates, uploads = [] }, { patch, upload, reload }) {
  if (!Array.isArray(uploads)) throw new TypeError("Selected Certification uploads must be an array.");
  let saved = existing;
  let metadataSaved = false;
  let uploading = false;
  const completedUploads = [];
  const validateSaved = (record) => {
    if (!record || record.id !== existing.id || !record.rowVersion) {
      throw new Error("Invalid Certification save response. Refresh the Library before retrying.");
    }
    return record;
  };
  try {
    if (Object.keys(updates).length) {
      saved = validateSaved(await patch(existing.id, updates, existing.rowVersion));
      metadataSaved = true;
    }
    const startOrder = Array.isArray(existing.supportingDocuments) ? existing.supportingDocuments.length : 0;
    for (let index = 0; index < uploads.length; index += 1) {
      uploading = true;
      const document = await upload(existing.id, { ...uploads[index], displayOrder: startOrder + index });
      if (!document?.id) throw new Error("The upload response was incomplete. Check saved documents before retrying.");
      completedUploads.push(uploads[index]);
      uploading = false;
    }
    return uploads.length ? validateSaved(await reload(existing.id)) : saved;
  } catch (cause) {
    const detail = cause?.publicMessage || cause?.message || "The Certification could not be saved.";
    const progress = completedUploads.length
      ? `${completedUploads.length} of ${uploads.length} selected documents were uploaded. Those completed files will not be submitted again. `
      : "";
    const metadataNote = metadataSaved ? "Certification metadata was saved. " : "";
    const message = metadataNote + progress + detail;
    const error = new Error(message, { cause });
    error.publicMessage = message;
    error.code = cause?.code;
    error.status = cause?.status;
    error.fieldErrors = cause?.fieldErrors;
    error.completedUploads = completedUploads;
    if (metadataSaved || completedUploads.length) {
      try { saved = validateSaved(await reload(existing.id)); } catch { /* Keep the last acknowledged version. */ }
      error.savedCertification = saved;
    }
    // A lost upload response can mean the server saved the file. Require review before retry.
    error.requiresDocumentReview = uploading &&
      (!cause?.status || Number(cause.status) >= 500);
    if (error.requiresDocumentReview) {
      error.publicMessage += " Close this editor, refresh and check saved documents before retrying the remaining files.";
    }
    throw error;
  }
}
