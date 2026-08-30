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
      label: "First Name Only",
      displayValue: firstName,
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

        label: `${getContactTypeLabel(
          "profilePictures",
          picture.type,
        )}${index === 0 ? " — Primary" : ""}`,

        displayValue:
          picture.description || picture.fileName || `Picture ${index + 1}`,

        imageUrl,
      };
    })
    .filter((option) => option.imageUrl);
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

export function buildSelectedProfile(profile, selections) {
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

  selections.forEach((selection) => {
    const selectedOption = getSelectedProfileValue(profile, selection);

    if (!selectedOption) {
      return;
    }

    if (selection.category === "name") {
      selectedProfile.selectedName = selectedOption.displayValue;

      return;
    }

    const selectedItem = profile[selection.category]?.find(
      (item) => item.id === selection.itemId,
    );

    if (selectedItem) {
      selectedProfile[selection.category].push(selectedItem);
    }
  });

  return selectedProfile;
}
