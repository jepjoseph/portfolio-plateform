import { apiRequest } from "../apiClient.js";

import {
  createPortfolioApiService,
} from "./portfolioApiService.js";

export function createPortfolioTransport(request) {
  if (typeof request !== "function") {
    throw new TypeError("An API transport is required.");
  }

  return (path, options = {}) => {
    if (
      typeof path !== "string" ||
      !path.startsWith("/api/")
    ) {
      throw new TypeError("Invalid Portfolio API path.");
    }

    const endpoint = path.slice(4);

    return request(endpoint, options);
  };
}

export const portfolioBackendService =
  createPortfolioApiService(
    createPortfolioTransport(apiRequest),
  );