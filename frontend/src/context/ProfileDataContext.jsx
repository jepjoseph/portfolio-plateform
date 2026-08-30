import { createContext, useContext, useMemo, useState } from "react";

const ProfileDataContext = createContext(null);

const INITIAL_PROFILE = {
  firstName: "Jean",
  middleName: "Pierre",
  lastName: "Joseph",

  professionalTitles: [
    {
      id: "title-1",
      name: "Electronic Engineer",
    },
    {
      id: "title-2",
      name: "Computer Engineer",
    },
    {
      id: "title-3",
      name: "IT Systems Administrator",
    },
  ],

  emails: [
    {
      id: "email-1",
      type: "personal",
      value: "jean@example.com",
      description: "",
    },
    {
      id: "email-2",
      type: "work",
      value: "contact@motich.com",
      description: "MOTICH business email",
    },
  ],

  phones: [
    {
      id: "phone-1",
      type: "personal",
      value: "+1 954 555 0100",
      description: "",
    },
  ],

  websites: [
    {
      id: "website-1",
      type: "portfolio",
      value: "https://motich.com",
      description: "Personal portfolio and MOTICH website",
    },
  ],

  locations: [
    {
      id: "location-1",
      type: "home",
      value: "Coconut Creek, FL",
      description: "",
    },
    {
      id: "location-2",
      type: "school",
      value: "Boca Raton, FL",
      description: "Florida Atlantic University",
    },
  ],

  socialLinks: [
    {
      id: "social-1",
      type: "linkedin",
      value: "https://linkedin.com/in/jean-pierre-joseph",
      description: "Professional LinkedIn profile",
    },
    {
      id: "social-2",
      type: "github",
      value: "https://github.com/jepjoseph",
      description: "Software projects and source code",
    },
  ],

  profilePictures: [
    {
      id: "picture-1",
      type: "profile",
      imageUrl: "",
      fileName: "",
      fileType: "",
      fileSize: 0,
      description: "Primary professional profile picture",
    },
    {
      id: "picture-2",
      type: "header-background",
      imageUrl: "",
      fileName: "",
      fileType: "",
      fileSize: 0,
      description: "Portfolio header background",
    },
  ],
};

export function ProfileDataProvider({ children }) {
  const [profile, setProfile] = useState(INITIAL_PROFILE);

  const contextValue = useMemo(
    () => ({
      profile,
      setProfile,
    }),
    [profile],
  );

  return (
    <ProfileDataContext.Provider value={contextValue}>
      {children}
    </ProfileDataContext.Provider>
  );
}

export function useProfileData() {
  const context = useContext(ProfileDataContext);

  if (!context) {
    throw new Error("useProfileData must be used inside ProfileDataProvider.");
  }

  return context;
}
