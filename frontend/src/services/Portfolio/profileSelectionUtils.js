import {
  CONTACT_INFORMATION_CONFIG,
  getContactTypeLabel,
} from "../PersonalInformation/contactInformationConfig";

export const PROFILE_CATEGORY_OPTIONS = [
  {
    value: "name",
    label: "Name",
  },
  {
    value: "professionalTitles",
    label: "Professional Title",
  },
  {
    value: "emails",
    label: "Email",
  },
  {
    value: "phones",
    label: "Phone",
  },
  {
    value: "websites",
    label: "Website",
  },
  {
    value: "locations",
    label: "Location",
  },
  {
    value: "socialLinks",
    label: "Social Profile",
  },
  {
    value: "profilePictures",
    label: "Picture",
  },
];

export const PICTURE_USAGE_OPTIONS = [
  {
    value: "profile",
    label: "Profile Picture",
  },
  {
    value: "headshot",
    label: "Professional Headshot",
  },
  {
    value: "avatar",
    label: "Avatar",
  },
  {
    value: "header-background",
    label: "Header Background",
  },
  {
    value: "portfolio-background",
    label: "Portfolio Background",
  },
  {
    value: "logo",
    label: "Logo",
  },
  {
    value: "icon",
    label: "Icon",
  },
];

function createNameOptions(profile) {
  const firstName = profile.firstName?.trim() || "";

  const middleName = profile.middleName?.trim() || "";

  const lastName = profile.lastName?.trim() || "";

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  const firstAndLastName = [firstName, lastName].filter(Boolean).join(" ");

  return [
    {
      id: "full-name",
      label: "Full Name",
      displayValue: fullName,
    },
    {
      id: "first-last-name",
      label: "First and Last Name",
      displayValue: firstAndLastName,
    },
    {
      id: "first-name",
      label: "First Name",
      displayValue: firstName,
    },
    {
      id: "middle-name",
      label: "Middle Name",
      displayValue: middleName,
    },
    {
      id: "last-name",
      label: "Last Name",
      displayValue: lastName,
    },
  ].filter((option) => option.displayValue);
}

function createProfessionalTitleOptions(profile) {
  return (profile.professionalTitles || []).map((title, index) => ({
    id: title.id,
    label: index === 0 ? `Primary — ${title.name}` : title.name,
    displayValue: title.name,
  }));
}

function createContactOptions(profile, category) {
  return (profile[category] || [])
    .filter((item) => item.value?.trim())
    .map((item, index) => ({
      id: item.id,

      label: `${getContactTypeLabel(
        category,
        item.type,
      )}${index === 0 ? " — Primary" : ""}`,

      displayValue: item.value,
    }));
}

/*
function createProfilePictureOptions(profile) {
  return (profile.profilePictures || []).map(
    (picture, index) => ({
      id: picture.id,
      label:
        picture.label ||
        `Profile Picture ${index + 1}`,
      displayValue:
        picture.fileName ||
        picture.label ||
        `Picture ${index + 1}`,
    }),
  );
}*/

function createProfilePictureOptions(profile) {
  return (profile.profilePictures || [])
    .map((picture, index) => {
      const imageUrl = picture.imageUrl || picture.fileUrl || picture.url || "";

      return {
        id: picture.id,

        label: picture.description || `Picture ${index + 1}`,

        displayValue: picture.fileName || `Picture ${index + 1}`,

        imageUrl,
      };
    })
    .filter((picture) => picture.imageUrl);
}

export function getProfileCategoryLabel(category) {
  return (
    PROFILE_CATEGORY_OPTIONS.find((option) => option.value === category)
      ?.label || category
  );
}

export function getProfileSelectionOptions(profile, category) {
  if (!profile || !category) {
    return [];
  }

  if (category === "name") {
    return createNameOptions(profile);
  }

  if (category === "professionalTitles") {
    return createProfessionalTitleOptions(profile);
  }

  if (category === "profilePictures") {
    return createProfilePictureOptions(profile);
  }

  if (CONTACT_INFORMATION_CONFIG[category]) {
    return createContactOptions(profile, category);
  }

  return [];
}

export function getSelectedProfileValue(profile, selection) {
  const options = getProfileSelectionOptions(profile, selection.category);

  return options.find((option) => option.id === selection.itemId);
}

export function buildSelectedProfile(profile, selections = []) {
  const selectedProfile = {
    firstName: "",
    middleName: "",
    lastName: "",
    professionalTitles: [],
    emails: [],
    phones: [],
    websites: [],
    locations: [],
    socialLinks: [],
    profilePictures: [],
    selectedName: "",
  };

  if (!profile) {
    return selectedProfile;
  }

  selections.forEach((selection) => {
    if (!selection?.category || !selection?.itemId) {
      return;
    }

    const selectedOption = getSelectedProfileValue(profile, selection);

    if (!selectedOption) {
      return;
    }

    /*
     * =========================================
     * Selected Name
     * =========================================
     */

    if (selection.category === "name") {
      selectedProfile.selectedName = selectedOption.displayValue;

      return;
    }

    /*
     * =========================================
     * Selected Reusable Information
     * =========================================
     */

    const selectedItem = profile[selection.category]?.find(
      (item) => item.id === selection.itemId,
    );

    if (!selectedItem) {
      return;
    }

    /*
     * =========================================
     * Selected Picture
     * =========================================
     *
     * Pictures stored in the reusable profile
     * do not have a permanent purpose.
     *
     * The portfolio selection assigns the
     * picture usage, such as:
     *
     * - profile
     * - headshot
     * - avatar
     * - header-background
     * - portfolio-background
     * - logo
     * - icon
     */

    if (selection.category === "profilePictures") {
      if (!selection.pictureUsage) {
        return;
      }

      selectedProfile.profilePictures.push({
        ...selectedItem,
        type: selection.pictureUsage,
      });

      return;
    }

    /*
     * =========================================
     * Other Profile Categories
     * =========================================
     */

    if (!Array.isArray(selectedProfile[selection.category])) {
      return;
    }

    selectedProfile[selection.category].push(selectedItem);
  });

  return selectedProfile;
}
