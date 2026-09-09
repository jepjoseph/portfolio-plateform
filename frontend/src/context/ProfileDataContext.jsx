import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createEmptyProfile } from "../models/profileModel.js";

import {
  addProfileItem as addProfileItemService,
  archiveProfile as archiveProfileService,
  archiveProfileItem as archiveProfileItemService,
  deleteProfile as deleteProfileService,
  deleteProfileItem as deleteProfileItemService,
  getProfile as getProfileService,
  getProfileCollection as getProfileCollectionService,
  getProfileItem as getProfileItemService,
  reorderProfileCollection as reorderProfileCollectionService,
  replaceProfileCollection as replaceProfileCollectionService,
  resetProfile as resetProfileService,
  restoreProfile as restoreProfileService,
  restoreProfileItem as restoreProfileItemService,
  setPrimaryProfileItem as setPrimaryProfileItemService,
  updateProfile as updateProfileService,
  updateProfileIdentity as updateProfileIdentityService,
  updateProfileItem as updateProfileItemService,
  updateProfileVisibility as updateProfileVisibilityService,
  validateProfileDraft as validateProfileDraftService,
} from "../services/Profile/profileService.js";

import { PROFILE_STORAGE_KEY } from "../services/Profile/profileStorage.js";

/*
 * =========================================
 * Context
 * =========================================
 */

const ProfileDataContext = createContext(null);

/*
 * =========================================
 * Existing Development Profile
 * =========================================
 *
 * This temporarily preserves your existing
 * development Profile during migration.
 *
 * Once authentication and the backend API are
 * implemented, new users should receive an empty
 * Profile instead of this development record.
 */

const DEVELOPMENT_INITIAL_PROFILE = {
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

  /*
   * Empty picture placeholders are omitted from
   * persisted Profile data. The form can create
   * temporary empty picture fields when editing.
   */

  profilePictures: [],
};

/*
 * =========================================
 * Initial Status
 * =========================================
 */

const INITIAL_OPERATION = {
  type: "",
  collectionName: "",
  itemId: "",
  status: "idle",
};

/*
 * =========================================
 * Error Normalization
 * =========================================
 */

function normalizeProfileContextError(error) {
  return {
    message:
      error?.publicMessage ||
      error?.message ||
      "An unexpected Profile error occurred.",

    code: error?.code || "PROFILE_OPERATION_FAILED",

    status: Number(error?.status) || 500,

    errors: Array.isArray(error?.errors) ? error.errors : [],

    warnings: Array.isArray(error?.warnings) ? error.warnings : [],

    conflicts: Array.isArray(error?.conflicts) ? error.conflicts : [],

    fieldErrors:
      error?.fieldErrors && typeof error.fieldErrors === "object"
        ? error.fieldErrors
        : {},

    validation: error?.validation || null,

    details: error?.details || null,

    originalError: error,
  };
}

/*
 * =========================================
 * Mutation Result
 * =========================================
 */

function getProfileFromResult(result) {
  if (result?.profile && typeof result.profile === "object") {
    return result.profile;
  }

  if (
    result &&
    typeof result === "object" &&
    Array.isArray(result.professionalTitles)
  ) {
    return result;
  }

  return null;
}

/*
 * =========================================
 * Provider
 * =========================================
 */

export function ProfileDataProvider({ children }) {
  const [profile, setProfileState] = useState(() => createEmptyProfile());

  const profileRef = useRef(profile);

  const [isLoading, setIsLoading] = useState(true);

  const [loadStatus, setLoadStatus] = useState("idle");

  const [saveStatus, setSaveStatus] = useState("idle");

  const [error, setError] = useState(null);

  const [operation, setOperation] = useState(INITIAL_OPERATION);

  /*
   * Keep asynchronous compatibility operations
   * synchronized with the latest Profile value.
   */

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  /*
   * =========================================
   * Status Management
   * =========================================
   */

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetSaveStatus = useCallback(() => {
    setSaveStatus("idle");
  }, []);

  const resetOperation = useCallback(() => {
    setOperation(INITIAL_OPERATION);
  }, []);

  /*
   * =========================================
   * Load Profile
   * =========================================
   */

  const refreshProfile = useCallback(async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) {
        setIsLoading(true);
        setLoadStatus("loading");
      }

      setError(null);

      const loadedProfile = await getProfileService({
        fallbackProfile: DEVELOPMENT_INITIAL_PROFILE,
      });

      setProfileState(loadedProfile);
      profileRef.current = loadedProfile;

      setLoadStatus("success");

      return loadedProfile;
    } catch (loadError) {
      console.error("Unable to load Profile:", loadError);

      setLoadStatus("error");

      setError(normalizeProfileContextError(loadError));

      throw loadError;
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  /*
   * =========================================
   * Initial Load
   * =========================================
   */

  useEffect(() => {
    let isActive = true;

    const loadInitialProfile = async () => {
      try {
        setIsLoading(true);
        setLoadStatus("loading");
        setError(null);

        const loadedProfile = await getProfileService({
          fallbackProfile: DEVELOPMENT_INITIAL_PROFILE,
        });

        if (!isActive) {
          return;
        }

        setProfileState(loadedProfile);
        profileRef.current = loadedProfile;

        setLoadStatus("success");
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        console.error("Unable to load Profile:", loadError);

        setLoadStatus("error");

        setError(normalizeProfileContextError(loadError));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadInitialProfile();

    return () => {
      isActive = false;
    };
  }, []);

  /*
   * =========================================
   * Cross-Tab Synchronization
   * =========================================
   */

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (
        event.storageArea !== window.localStorage ||
        event.key !== PROFILE_STORAGE_KEY
      ) {
        return;
      }

      refreshProfile({
        showLoading: false,
      }).catch(() => {
        /*
         * Context already records the error.
         */
      });
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refreshProfile]);

  /*
   * =========================================
   * Shared Mutation Runner
   * =========================================
   */

  const performMutation = useCallback(
    async ({ type, collectionName = "", itemId = "", action }) => {
      try {
        setSaveStatus("saving");
        setError(null);

        setOperation({
          type,
          collectionName,
          itemId,
          status: "loading",
        });

        const result = await action();

        const updatedProfile = getProfileFromResult(result);

        if (updatedProfile) {
          setProfileState(updatedProfile);
          profileRef.current = updatedProfile;
        }

        setSaveStatus("success");

        setOperation({
          type,
          collectionName,
          itemId: itemId || result?.item?.id || "",
          status: "success",
        });

        return result;
      } catch (mutationError) {
        console.error(
          `Unable to complete Profile operation "${type}":`,
          mutationError,
        );

        setSaveStatus("error");

        setOperation({
          type,
          collectionName,
          itemId,
          status: "error",
        });

        setError(normalizeProfileContextError(mutationError));

        throw mutationError;
      }
    },
    [],
  );

  /*
   * =========================================
   * Complete Profile Update
   * =========================================
   */

  const updateProfile = useCallback(
    async (profileData) =>
      performMutation({
        type: "update-profile",

        action: () => updateProfileService(profileData),
      }),
    [performMutation],
  );

  /*
   * =========================================
   * Compatibility setProfile
   * =========================================
   *
   * Existing components currently use:
   *
   * setProfile(updatedProfile)
   *
   * or:
   *
   * setProfile(current => nextProfile)
   *
   * This preserves both patterns while routing
   * persistence through profileService.
   */

  const setProfile = useCallback(
    async (valueOrUpdater) => {
      const currentProfile = profileRef.current;

      const nextProfile =
        typeof valueOrUpdater === "function"
          ? valueOrUpdater(currentProfile)
          : valueOrUpdater;

      return updateProfile(nextProfile);
    },
    [updateProfile],
  );

  /*
   * =========================================
   * Identity Update
   * =========================================
   */

  const updateProfileIdentity = useCallback(
    async (identityUpdates) =>
      performMutation({
        type: "update-identity",

        action: () => updateProfileIdentityService(identityUpdates),
      }),
    [performMutation],
  );

  /*
   * =========================================
   * Collection Read Operations
   * =========================================
   */

  const getProfileCollection = useCallback(
    async (collectionName, options = {}) => {
      try {
        setError(null);

        return await getProfileCollectionService(collectionName, options);
      } catch (readError) {
        console.error("Unable to read Profile collection:", readError);

        setError(normalizeProfileContextError(readError));

        throw readError;
      }
    },
    [],
  );

  const getProfileItem = useCallback(async (collectionName, itemId) => {
    try {
      setError(null);

      return await getProfileItemService(collectionName, itemId);
    } catch (readError) {
      console.error("Unable to read Profile item:", readError);

      setError(normalizeProfileContextError(readError));

      throw readError;
    }
  }, []);

  /*
   * =========================================
   * Add Item
   * =========================================
   */

  const addProfileItem = useCallback(
    async (collectionName, itemData = {}) =>
      performMutation({
        type: "add-item",
        collectionName,

        action: () => addProfileItemService(collectionName, itemData),
      }),
    [performMutation],
  );

  /*
   * =========================================
   * Update Item
   * =========================================
   */

  const updateProfileItem = useCallback(
    async (collectionName, itemId, updates = {}) =>
      performMutation({
        type: "update-item",
        collectionName,
        itemId,

        action: () => updateProfileItemService(collectionName, itemId, updates),
      }),
    [performMutation],
  );

  /*
   * =========================================
   * Replace Collection
   * =========================================
   */

  const replaceProfileCollection = useCallback(
    async (collectionName, collectionValues) =>
      performMutation({
        type: "replace-collection",
        collectionName,

        action: async () => {
          const updatedProfile = await replaceProfileCollectionService(
            collectionName,
            collectionValues,
          );

          return {
            profile: updatedProfile,
          };
        },
      }),
    [performMutation],
  );

  /*
   * =========================================
   * Reorder Collection
   * =========================================
   */

  const reorderProfileCollection = useCallback(
    async (collectionName, orderedItemIds) =>
      performMutation({
        type: "reorder-collection",
        collectionName,

        action: async () => {
          const updatedProfile = await reorderProfileCollectionService(
            collectionName,
            orderedItemIds,
          );

          return {
            profile: updatedProfile,
          };
        },
      }),
    [performMutation],
  );

  /*
   * =========================================
   * Primary Item
   * =========================================
   */

  const setPrimaryProfileItem = useCallback(
    async (collectionName, itemId) =>
      performMutation({
        type: "set-primary",
        collectionName,
        itemId,

        action: () => setPrimaryProfileItemService(collectionName, itemId),
      }),
    [performMutation],
  );

  /*
   * =========================================
   * Archive Item
   * =========================================
   */

  const archiveProfileItem = useCallback(
    async (collectionName, itemId) =>
      performMutation({
        type: "archive-item",
        collectionName,
        itemId,

        action: () => archiveProfileItemService(collectionName, itemId),
      }),
    [performMutation],
  );

  /*
   * =========================================
   * Restore Item
   * =========================================
   */

  const restoreProfileItem = useCallback(
    async (collectionName, itemId) =>
      performMutation({
        type: "restore-item",
        collectionName,
        itemId,

        action: () => restoreProfileItemService(collectionName, itemId),
      }),
    [performMutation],
  );

  /*
   * =========================================
   * Delete Item
   * =========================================
   */

  const deleteProfileItem = useCallback(
    async (collectionName, itemId) =>
      performMutation({
        type: "delete-item",
        collectionName,
        itemId,

        action: () => deleteProfileItemService(collectionName, itemId),
      }),
    [performMutation],
  );

  /*
   * =========================================
   * Visibility
   * =========================================
   */

  const updateProfileVisibility = useCallback(
    async (visibilityUpdates) =>
      performMutation({
        type: "update-visibility",

        action: () => updateProfileVisibilityService(visibilityUpdates),
      }),
    [performMutation],
  );

  /*
   * =========================================
   * Archive and Restore Profile
   * =========================================
   */

  const archiveProfile = useCallback(
    async () =>
      performMutation({
        type: "archive-profile",
        action: archiveProfileService,
      }),
    [performMutation],
  );

  const restoreProfile = useCallback(
    async () =>
      performMutation({
        type: "restore-profile",
        action: restoreProfileService,
      }),
    [performMutation],
  );

  /*
   * =========================================
   * Validation
   * =========================================
   */

  const validateProfileDraft = useCallback(async (profileData) => {
    try {
      return await validateProfileDraftService(profileData);
    } catch (validationError) {
      console.error("Unable to validate Profile:", validationError);

      setError(normalizeProfileContextError(validationError));

      throw validationError;
    }
  }, []);

  /*
   * =========================================
   * Reset Profile
   * =========================================
   */

  const resetProfile = useCallback(
    async ({ preserveDevelopmentData = false } = {}) =>
      performMutation({
        type: "reset-profile",

        action: () =>
          resetProfileService(
            preserveDevelopmentData ? DEVELOPMENT_INITIAL_PROFILE : null,
          ),
      }),
    [performMutation],
  );

  /*
   * =========================================
   * Delete Complete Profile
   * =========================================
   */

  const deleteProfile = useCallback(async () => {
    const result = await performMutation({
      type: "delete-profile",
      action: deleteProfileService,
    });

    const emptyProfile = createEmptyProfile();

    setProfileState(emptyProfile);
    profileRef.current = emptyProfile;

    return result;
  }, [performMutation]);

  /*
   * =========================================
   * Derived Profile Collections
   * =========================================
   */

  const activeCollections = useMemo(() => {
    const getActive = (collectionName) =>
      (profile[collectionName] || []).filter(
        (item) => item.status !== "archived",
      );

    return {
      professionalTitles: getActive("professionalTitles"),

      emails: getActive("emails"),
      phones: getActive("phones"),
      websites: getActive("websites"),
      locations: getActive("locations"),
      socialLinks: getActive("socialLinks"),

      profilePictures: getActive("profilePictures"),
    };
  }, [profile]);

  const archivedCollections = useMemo(() => {
    const getArchived = (collectionName) =>
      (profile[collectionName] || []).filter(
        (item) => item.status === "archived",
      );

    return {
      professionalTitles: getArchived("professionalTitles"),

      emails: getArchived("emails"),
      phones: getArchived("phones"),
      websites: getArchived("websites"),
      locations: getArchived("locations"),
      socialLinks: getArchived("socialLinks"),

      profilePictures: getArchived("profilePictures"),
    };
  }, [profile]);

  /*
   * =========================================
   * Profile Statistics
   * =========================================
   */

  const statistics = useMemo(() => {
    const collectionNames = [
      "professionalTitles",
      "emails",
      "phones",
      "websites",
      "locations",
      "socialLinks",
      "profilePictures",
    ];

    const totalItems = collectionNames.reduce(
      (total, collectionName) => total + (profile[collectionName]?.length || 0),
      0,
    );

    const activeItems = Object.values(activeCollections).reduce(
      (total, collection) => total + collection.length,
      0,
    );

    const archivedItems = Object.values(archivedCollections).reduce(
      (total, collection) => total + collection.length,
      0,
    );

    return {
      totalItems,
      activeItems,
      archivedItems,

      professionalTitles: activeCollections.professionalTitles.length,

      contactMethods:
        activeCollections.emails.length +
        activeCollections.phones.length +
        activeCollections.websites.length +
        activeCollections.socialLinks.length,

      locations: activeCollections.locations.length,

      pictures: activeCollections.profilePictures.length,
    };
  }, [profile, activeCollections, archivedCollections]);

  /*
   * =========================================
   * Context Value
   * =========================================
   */

  const contextValue = useMemo(
    () => ({
      /*
       * Profile
       */

      profile,
      setProfile,

      /*
       * Derived Information
       */

      activeCollections,
      archivedCollections,
      statistics,

      /*
       * Status
       */

      isLoading,
      loadStatus,
      saveStatus,
      operation,
      error,

      /*
       * Read Operations
       */

      refreshProfile,
      getProfileCollection,
      getProfileItem,

      /*
       * Profile Operations
       */

      updateProfile,
      updateProfileIdentity,
      updateProfileVisibility,
      archiveProfile,
      restoreProfile,
      resetProfile,
      deleteProfile,

      /*
       * Child Item Operations
       */

      addProfileItem,
      updateProfileItem,
      replaceProfileCollection,
      reorderProfileCollection,
      setPrimaryProfileItem,
      archiveProfileItem,
      restoreProfileItem,
      deleteProfileItem,

      /*
       * Validation
       */

      validateProfileDraft,

      /*
       * Status Management
       */

      clearError,
      resetSaveStatus,
      resetOperation,
    }),
    [
      profile,
      setProfile,
      activeCollections,
      archivedCollections,
      statistics,
      isLoading,
      loadStatus,
      saveStatus,
      operation,
      error,
      refreshProfile,
      getProfileCollection,
      getProfileItem,
      updateProfile,
      updateProfileIdentity,
      updateProfileVisibility,
      archiveProfile,
      restoreProfile,
      resetProfile,
      deleteProfile,
      addProfileItem,
      updateProfileItem,
      replaceProfileCollection,
      reorderProfileCollection,
      setPrimaryProfileItem,
      archiveProfileItem,
      restoreProfileItem,
      deleteProfileItem,
      validateProfileDraft,
      clearError,
      resetSaveStatus,
      resetOperation,
    ],
  );

  return (
    <ProfileDataContext.Provider value={contextValue}>
      {children}
    </ProfileDataContext.Provider>
  );
}

/*
 * =========================================
 * Context Hook
 * =========================================
 */

export function useProfileData() {
  const context = useContext(ProfileDataContext);

  if (!context) {
    throw new Error("useProfileData must be used inside ProfileDataProvider.");
  }

  return context;
}
