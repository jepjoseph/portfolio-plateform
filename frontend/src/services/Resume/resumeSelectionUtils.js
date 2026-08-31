import { getProfileSelectionOptions } from "../Portfolio/profileSelectionUtils";

export const EMPTY_SELECTED_RESUME_HEADER = {
  name: "",
  professionalTitle: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  website: "",
  picture: null,
};

function getSelectedOption(profile, category, optionId) {
  if (!profile || !optionId) {
    return null;
  }

  const options = getProfileSelectionOptions(profile, category);

  return options.find((option) => option.id === optionId) || null;
}

function getProfileItem(profile, category, itemId) {
  if (!profile || !itemId || !Array.isArray(profile[category])) {
    return null;
  }

  return profile[category].find((item) => item.id === itemId) || null;
}

function getPictureUrl(picture) {
  return picture?.imageUrl || picture?.fileUrl || picture?.url || "";
}

/*
 * =========================================
 * Build Selected Resume Header
 * =========================================
 *
 * The resume stores only selection IDs.
 * This function resolves those IDs against
 * the reusable profile whenever the resume
 * is previewed, exported, shared, or displayed.
 */

export function buildSelectedResumeHeader(profile, headerSelections = {}) {
  const selectedHeader = {
    ...EMPTY_SELECTED_RESUME_HEADER,
  };

  if (!profile) {
    return selectedHeader;
  }

  /*
   * =========================================
   * Name Format
   * =========================================
   */

  const selectedName = getSelectedOption(
    profile,
    "name",
    headerSelections.nameOptionId,
  );

  selectedHeader.name = selectedName?.displayValue || "";

  /*
   * =========================================
   * Professional Title
   * =========================================
   */

  const selectedProfessionalTitle = getProfileItem(
    profile,
    "professionalTitles",
    headerSelections.professionalTitleId,
  );

  selectedHeader.professionalTitle =
    selectedProfessionalTitle?.name?.trim() || "";

  /*
   * =========================================
   * Contact Information
   * =========================================
   */

  const selectedEmail = getProfileItem(
    profile,
    "emails",
    headerSelections.emailId,
  );

  const selectedPhone = getProfileItem(
    profile,
    "phones",
    headerSelections.phoneId,
  );

  const selectedLocation = getProfileItem(
    profile,
    "locations",
    headerSelections.locationId,
  );

  const selectedLinkedIn = getProfileItem(
    profile,
    "socialLinks",
    headerSelections.linkedinId,
  );

  const selectedWebsite = getProfileItem(
    profile,
    "websites",
    headerSelections.websiteId,
  );

  selectedHeader.email = selectedEmail?.value?.trim() || "";
  selectedHeader.phone = selectedPhone?.value?.trim() || "";
  selectedHeader.location = selectedLocation?.value?.trim() || "";

  selectedHeader.linkedin =
    selectedLinkedIn?.type === "linkedin"
      ? selectedLinkedIn.value?.trim() || ""
      : "";

  selectedHeader.website = selectedWebsite?.value?.trim() || "";

  /*
   * =========================================
   * Optional Picture
   * =========================================
   */

  const selectedPicture = getProfileItem(
    profile,
    "profilePictures",
    headerSelections.pictureId,
  );

  const pictureUrl = getPictureUrl(selectedPicture);

  if (selectedPicture && pictureUrl) {
    selectedHeader.picture = {
      id: selectedPicture.id,
      imageUrl: pictureUrl,
      fileName: selectedPicture.fileName || "",
      fileType: selectedPicture.fileType || "",
      fileSize: selectedPicture.fileSize || 0,
      description: selectedPicture.description?.trim() || "",
    };
  }

  return selectedHeader;
}
