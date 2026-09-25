import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext.jsx";
import {
  addProfileItem as addItemService,
  archiveProfile as archiveService,
  archiveProfileItem as archiveItemService,
  deleteProfile as deleteService,
  deleteProfileItem as deleteItemService,
  getProfile as getProfileService,
  getProfileCollection as getCollectionService,
  getProfileItem as getItemService,
  reorderProfileCollection as reorderService,
  replaceProfileCollection as replaceCollectionService,
  resetProfile as resetService,
  restoreProfile as restoreService,
  restoreProfileItem as restoreItemService,
  setPrimaryProfileItem as setPrimaryService,
  updateProfile as updateService,
  updateProfileIdentity as updateIdentityService,
  updateProfileItem as updateItemService,
  updateProfileVisibility as updateVisibilityService,
  validateProfileDraft as validateService,
} from "../services/Profile/profileService.js";

const ProfileDataContext = createContext(null);

const IDLE_OPERATION = Object.freeze({
  type: "",
  collectionName: "",
  itemId: "",
  status: "idle",
});

function normalizeError(error) {
  return {
    message: error?.publicMessage || error?.message || "An unexpected Profile error occurred.",
    code: error?.code || "PROFILE_OPERATION_FAILED",
    status: Number(error?.status) || 500,
    errors: Array.isArray(error?.errors) ? error.errors : [],
    warnings: Array.isArray(error?.warnings) ? error.warnings : [],
    conflicts: Array.isArray(error?.conflicts) ? error.conflicts : [],
    fieldErrors: error?.fieldErrors && typeof error.fieldErrors === "object" ? error.fieldErrors : {},
    details: error?.details || null,
    originalError: error,
  };
}

function profileFromResult(result) {
  if (result?.profile) return result.profile;
  if (result?.professionalTitles) return result;
  return null;
}

export function ProfileDataProvider({ children }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const [profile, setProfileState] = useState(null);
  const profileRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState("idle");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [operation, setOperation] = useState(IDLE_OPERATION);
  const [error, setError] = useState(null);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const clearError = useCallback(() => setError(null), []);
  const resetSaveStatus = useCallback(() => setSaveStatus("idle"), []);
  const resetOperation = useCallback(() => setOperation(IDLE_OPERATION), []);

  const refreshProfile = useCallback(async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) setIsLoading(true);
      setLoadStatus("loading");
      setError(null);
      const loadedProfile = await getProfileService();
      setProfileState(loadedProfile);
      profileRef.current = loadedProfile;
      setLoadStatus("success");
      return loadedProfile;
    } catch (loadError) {
      setLoadStatus("error");
      setError(normalizeError(loadError));
      throw loadError;
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated) {
      setProfileState(null);
      profileRef.current = null;
      setLoadStatus("idle");
      setIsLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setIsLoading(true);
    setLoadStatus("loading");
    setError(null);

    getProfileService()
      .then((loadedProfile) => {
        if (!active) return;
        setProfileState(loadedProfile);
        profileRef.current = loadedProfile;
        setLoadStatus("success");
      })
      .catch((loadError) => {
        if (!active) return;
        setLoadStatus("error");
        setError(normalizeError(loadError));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, isInitializing]);

  const performMutation = useCallback(async ({ type, collectionName = "", itemId = "", action }) => {
    try {
      setSaveStatus("saving");
      setError(null);
      setOperation({ type, collectionName, itemId, status: "loading" });
      const result = await action();
      const nextProfile = profileFromResult(result);
      if (nextProfile) {
        setProfileState(nextProfile);
        profileRef.current = nextProfile;
      }
      setSaveStatus("success");
      setOperation({ type, collectionName, itemId: itemId || result?.item?.id || "", status: "success" });
      return result;
    } catch (mutationError) {
      setSaveStatus("error");
      setOperation({ type, collectionName, itemId, status: "error" });
      setError(normalizeError(mutationError));
      throw mutationError;
    }
  }, []);

  const updateProfile = useCallback(
    (value) => performMutation({ type: "update-profile", action: () => updateService(value) }),
    [performMutation],
  );

  const setProfile = useCallback(
    (valueOrUpdater) => {
      const next = typeof valueOrUpdater === "function" ? valueOrUpdater(profileRef.current) : valueOrUpdater;
      return updateProfile(next);
    },
    [updateProfile],
  );

  const wrap = useCallback(
    (type, service, collectionName = "", itemId = "") =>
      performMutation({ type, collectionName, itemId, action: service }),
    [performMutation],
  );

  const updateProfileIdentity = useCallback((updates) => wrap("update-identity", () => updateIdentityService(updates)), [wrap]);
  const updateProfileVisibility = useCallback((updates) => wrap("update-visibility", () => updateVisibilityService(updates)), [wrap]);
  const archiveProfile = useCallback(() => wrap("archive-profile", archiveService), [wrap]);
  const restoreProfile = useCallback(() => wrap("restore-profile", restoreService), [wrap]);
  const resetProfile = useCallback(() => wrap("reset-profile", resetService), [wrap]);
  const deleteProfile = useCallback(() => wrap("delete-profile", deleteService), [wrap]);
  const addProfileItem = useCallback((name, data) => wrap("add-item", () => addItemService(name, data), name), [wrap]);
  const updateProfileItem = useCallback((name, id, data) => wrap("update-item", () => updateItemService(name, id, data), name, id), [wrap]);
  const replaceProfileCollection = useCallback((name, values) => wrap("replace-collection", async () => ({ profile: await replaceCollectionService(name, values) }), name), [wrap]);
  const reorderProfileCollection = useCallback((name, ids) => wrap("reorder-collection", async () => ({ profile: await reorderService(name, ids) }), name), [wrap]);
  const setPrimaryProfileItem = useCallback((name, id) => wrap("set-primary", () => setPrimaryService(name, id), name, id), [wrap]);
  const archiveProfileItem = useCallback((name, id) => wrap("archive-item", () => archiveItemService(name, id), name, id), [wrap]);
  const restoreProfileItem = useCallback((name, id) => wrap("restore-item", () => restoreItemService(name, id), name, id), [wrap]);
  const deleteProfileItem = useCallback((name, id) => wrap("delete-item", () => deleteItemService(name, id), name, id), [wrap]);

  const getProfileCollection = useCallback((name, options) => getCollectionService(name, options), []);
  const getProfileItem = useCallback((name, id, options) => getItemService(name, id, options), []);
  const validateProfileDraft = useCallback((value) => validateService(value), []);

  const activeCollections = useMemo(() => {
    const names = ["professionalTitles", "emails", "phones", "websites", "locations", "socialLinks", "profilePictures"];
    return Object.fromEntries(names.map((name) => [name, (profile?.[name] || []).filter((item) => item.status !== "archived")]));
  }, [profile]);

  const archivedCollections = useMemo(() => {
    const names = ["professionalTitles", "emails", "phones", "websites", "locations", "socialLinks", "profilePictures"];
    return Object.fromEntries(names.map((name) => [name, (profile?.[name] || []).filter((item) => item.status === "archived")]));
  }, [profile]);

  const statistics = useMemo(() => {
    const activeItems = Object.values(activeCollections).reduce((total, values) => total + values.length, 0);
    const archivedItems = Object.values(archivedCollections).reduce((total, values) => total + values.length, 0);
    return {
      totalItems: activeItems + archivedItems,
      activeItems,
      archivedItems,
      professionalTitles: activeCollections.professionalTitles.length,
      contactMethods: activeCollections.emails.length + activeCollections.phones.length + activeCollections.websites.length + activeCollections.socialLinks.length,
      locations: activeCollections.locations.length,
      pictures: activeCollections.profilePictures.length,
    };
  }, [activeCollections, archivedCollections]);

  const value = useMemo(() => ({
    profile, setProfile, activeCollections, archivedCollections, statistics,
    isLoading, loadStatus, saveStatus, operation, error,
    refreshProfile, getProfileCollection, getProfileItem,
    updateProfile, updateProfileIdentity, updateProfileVisibility,
    archiveProfile, restoreProfile, resetProfile, deleteProfile,
    addProfileItem, updateProfileItem, replaceProfileCollection,
    reorderProfileCollection, setPrimaryProfileItem, archiveProfileItem,
    restoreProfileItem, deleteProfileItem, validateProfileDraft,
    clearError, resetSaveStatus, resetOperation,
  }), [
    profile, setProfile, activeCollections, archivedCollections, statistics,
    isLoading, loadStatus, saveStatus, operation, error, refreshProfile,
    getProfileCollection, getProfileItem, updateProfile, updateProfileIdentity,
    updateProfileVisibility, archiveProfile, restoreProfile, resetProfile,
    deleteProfile, addProfileItem, updateProfileItem, replaceProfileCollection,
    reorderProfileCollection, setPrimaryProfileItem, archiveProfileItem,
    restoreProfileItem, deleteProfileItem, validateProfileDraft,
    clearError, resetSaveStatus, resetOperation,
  ]);

  return <ProfileDataContext.Provider value={value}>{children}</ProfileDataContext.Provider>;
}

export function useProfileData() {
  const context = useContext(ProfileDataContext);
  if (!context) throw new Error("useProfileData must be used inside ProfileDataProvider.");
  return context;
}

