export const CONTACT_INFORMATION_CONFIG = {
  emails: {
    singular: "Email",
    plural: "Email Addresses",
    eyebrow: "Email",
    inputType: "email",
    inputMode: "email",
    autoComplete: "email",
    placeholder: "name@example.com",
    icon: "@",
    defaultType: "personal",

    typeOptions: [
      {
        value: "personal",
        label: "Personal Email",
      },
      {
        value: "work",
        label: "Work Email",
      },
      {
        value: "school",
        label: "School Email",
      },
      {
        value: "business",
        label: "Business Email",
      },
      {
        value: "other",
        label: "Other Email",
      },
    ],
  },

  phones: {
    singular: "Phone",
    plural: "Phone Numbers",
    eyebrow: "Phone",
    inputType: "tel",
    inputMode: "tel",
    autoComplete: "tel",
    placeholder: "+1 954 555 0100",
    icon: "☎",
    defaultType: "personal",

    typeOptions: [
      {
        value: "personal",
        label: "Personal Phone",
      },
      {
        value: "mobile",
        label: "Mobile Phone",
      },
      {
        value: "home",
        label: "Home Phone",
      },
      {
        value: "work",
        label: "Work Phone",
      },
      {
        value: "school",
        label: "School Phone",
      },
      {
        value: "other",
        label: "Other Phone",
      },
    ],
  },

  websites: {
    singular: "Website",
    plural: "Websites",
    eyebrow: "Website",
    inputType: "text",
    inputMode: "url",
    autoComplete: "url",
    placeholder: "https://example.com",
    icon: "↗",
    defaultType: "portfolio",

    typeOptions: [
      {
        value: "portfolio",
        label: "Portfolio Website",
      },
      {
        value: "personal",
        label: "Personal Website",
      },
      {
        value: "business",
        label: "Business Website",
      },
      {
        value: "company",
        label: "Company Website",
      },
      {
        value: "school",
        label: "School Website",
      },
      {
        value: "blog",
        label: "Blog",
      },
      {
        value: "other",
        label: "Other Website",
      },
    ],
  },

  locations: {
    singular: "Location",
    plural: "Locations",
    eyebrow: "Location",
    inputType: "text",
    inputMode: "text",
    autoComplete: "street-address",
    placeholder: "City, State or full address",
    icon: "⌖",
    defaultType: "home",

    typeOptions: [
      {
        value: "home",
        label: "Home Location",
      },
      {
        value: "office",
        label: "Office Location",
      },
      {
        value: "work",
        label: "Work Location",
      },
      {
        value: "school",
        label: "School Location",
      },
      {
        value: "business",
        label: "Business Location",
      },
      {
        value: "other",
        label: "Other Location",
      },
    ],
  },

  socialLinks: {
    singular: "Social Link",
    plural: "Social Links",
    eyebrow: "Social",
    inputType: "text",
    inputMode: "url",
    autoComplete: "url",
    placeholder: "https://...",
    icon: "↗",
    defaultType: "linkedin",

    typeOptions: [
      {
        value: "linkedin",
        label: "LinkedIn",
        icon: "in",
      },
      {
        value: "github",
        label: "GitHub",
        icon: "GH",
      },
      {
        value: "youtube",
        label: "YouTube",
        icon: "YT",
      },
      {
        value: "facebook",
        label: "Facebook",
        icon: "f",
      },
      {
        value: "instagram",
        label: "Instagram",
        icon: "IG",
      },
      {
        value: "x",
        label: "X",
        icon: "X",
      },
      {
        value: "other",
        label: "Other Social Profile",
        icon: "↗",
      },
    ],
  },
  profilePictures: {
    singular: "Picture",
    plural: "Pictures",
    eyebrow: "Media",
    kind: "image",
    inputType: "file",
    accept: ".gif,.jpg,.jpg,.jpeg,.png,.webp,.avif",
    allowedFileTypes: [
      "image/gif",
      "image/jpg",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ],

    /*
     * Keep development images small because Base64 data
     * is temporarily stored in sessionStorage/localStorage.
     */

    maxFileSize: 20 * 1024 * 1024,

    icon: "▧",
    defaultType: "profile",

    typeOptions: [
      {
        value: "profile",
        label: "Profile Picture",
        icon: "◉",
      },
      {
        value: "headshot",
        label: "Professional Headshot",
        icon: "◉",
      },
      {
        value: "avatar",
        label: "Avatar",
        icon: "◉",
      },
      {
        value: "header-background",
        label: "Header Background",
        icon: "▧",
      },
      {
        value: "portfolio-background",
        label: "Portfolio Background",
        icon: "▧",
      },
      {
        value: "logo",
        label: "Personal or Business Logo",
        icon: "◆",
      },
      {
        value: "other",
        label: "Other Picture",
        icon: "▧",
      },
    ],
  },
};

export function getContactTypeOption(category, type) {
  const config = CONTACT_INFORMATION_CONFIG[category];

  return config?.typeOptions.find((typeOption) => typeOption.value === type);
}

export function getContactTypeLabel(category, type) {
  const config = CONTACT_INFORMATION_CONFIG[category];
  const option = getContactTypeOption(category, type);

  return option?.label || type || config?.singular || "Contact";
}

export function getContactIcon(category, type) {
  const config = CONTACT_INFORMATION_CONFIG[category];
  const option = getContactTypeOption(category, type);

  return option?.icon || config?.icon || "✦";
}
