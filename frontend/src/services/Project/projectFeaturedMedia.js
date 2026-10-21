function isEligibleFeaturedMedia(mediaItem) {
  return Boolean(
    mediaItem &&
      mediaItem.status !== "archived" &&
      mediaItem.visibility !== "private" &&
      (mediaItem.storageKey || mediaItem.externalUrl),
  );
}

export function prepareFeaturedProjectMedia(
  existingMedia = [],
  uploadedMedia = [],
  requestedFeaturedMediaId = "",
) {
  const uploadedFeaturedMedia = uploadedMedia.find(
    (item) => item.isFeatured && isEligibleFeaturedMedia(item),
  );

  const previousMedia = existingMedia.map((item) => ({
    ...item,
    isFeatured: uploadedFeaturedMedia ? false : item.isFeatured,
  }));

  const completeMedia = [...previousMedia, ...uploadedMedia];

  const featuredMedia =
    uploadedFeaturedMedia ||
    completeMedia.find(
      (item) =>
        item.id === requestedFeaturedMediaId &&
        isEligibleFeaturedMedia(item),
    ) ||
    completeMedia.find(
      (item) => item.isFeatured && isEligibleFeaturedMedia(item),
    ) ||
    completeMedia.find(isEligibleFeaturedMedia) ||
    null;

  return {
    media: completeMedia.map((item) => ({
      ...item,
      isFeatured: item.id === featuredMedia?.id,
    })),
    featuredMediaId: featuredMedia?.id || "",
  };
}
