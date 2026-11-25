/**
 * SQL-backed Portfolio API client.
 *
 * Transport is injected so the application can reuse
 * its existing authentication and API configuration.
 */

export function createPortfolioApiService(request) {
  if (typeof request !== "function") {
    throw new TypeError("An API request function is required.");
  }

  const base = "/api/portfolios";

  const segment = value => {
    if (typeof value !== "string" || !value.trim()) {
      throw new TypeError("A valid identifier is required.");
    }

    return encodeURIComponent(value.trim());
  };

  const portfolioPath = id =>
    `${base}/${segment(id)}`;

  async function send(method, path, body) {
    const options = { method };

    if (body !== undefined) {
      options.body = body;
    }

    const response = await request(path, options);

    if (
      !response ||
      response.status !== "success" ||
      !response.data
    ) {
      throw new Error("Invalid Portfolio API response.");
    }

    return response.data;
  }

  return Object.freeze({

    // Portfolio CRUD

    listPortfolios() {
      return send("GET", base);
    },

    getPortfolio(id) {
      return send("GET", portfolioPath(id));
    },

    createPortfolio(portfolio) {
      return send("POST", base, portfolio);
    },

    updatePortfolio(id, updates, rowVersion) {
      return send("PATCH", portfolioPath(id), {
        updates,
        rowVersion,
      });
    },

    deletePortfolio(id, rowVersion) {
      return send("DELETE", portfolioPath(id), {
        rowVersion,
      });
    },

    // Section configuration

    getSections(id) {
      return send(
        "GET",
        `${portfolioPath(id)}/sections`,
      );
    },

    saveSections(id, sections, rowVersion) {
      return send(
        "PUT",
        `${portfolioPath(id)}/sections`,
        { sections, rowVersion },
      );
    },

    // Source record selection

    getItems(id) {
      return send(
        "GET",
        `${portfolioPath(id)}/items`,
      );
    },

    saveItems(id, items, rowVersion) {
      return send(
        "PUT",
        `${portfolioPath(id)}/items`,
        { items, rowVersion },
      );
    },

    // URL management

    getSlugs(id) {
      return send(
        "GET",
        `${portfolioPath(id)}/slugs`,
      );
    },

    reserveCustomSlug(id, slug, rowVersion) {
      return send(
        "POST",
        `${portfolioPath(id)}/slugs`,
        {
          routeType: "custom",
          slug,
          rowVersion,
        },
      );
    },

    reserveProviderSlug(id, consent, rowVersion) {
      if (consent !== true) {
        throw new Error(
          "Explicit email URL consent is required.",
        );
      }

      return send(
        "POST",
        `${portfolioPath(id)}/slugs`,
        {
          routeType: "provider",
          consent,
          rowVersion,
        },
      );
    },

    setPrimarySlug(id, slugId, rowVersion) {
      return send(
        "PATCH",
        `${portfolioPath(id)}/slugs/${segment(slugId)}/primary`,
        { rowVersion },
      );
    },

    deleteSlug(id, slugId, rowVersion) {
      return send(
        "DELETE",
        `${portfolioPath(id)}/slugs/${segment(slugId)}`,
        { rowVersion },
      );
    },

    // Preview and publication

    getPreview(id) {
      return send(
        "GET",
        `${portfolioPath(id)}/preview`,
      );
    },

    getPublication(id) {
      return send(
        "GET",
        `${portfolioPath(id)}/publication`,
      );
    },

    publishPortfolio(id, consent, rowVersion) {
      if (consent !== true) {
        throw new Error(
          "Explicit publication consent is required.",
        );
      }

      return send(
        "POST",
        `${portfolioPath(id)}/publish`,
        { consent, rowVersion },
      );
    },

    unpublishPortfolio(id, rowVersion) {
      return send(
        "POST",
        `${portfolioPath(id)}/unpublish`,
        { rowVersion },
      );
    },

    // Public retrieval

    getPublicPortfolio(routeKey) {
      const route = String(routeKey)
        .trim()
        .toLowerCase();

      const valid =
        /^(?:[gyio]\/)?[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/
          .test(route);

      if (
        !valid ||
        route.includes("..") ||
        route.length > 200
      ) {
        throw new Error("Invalid public Portfolio URL.");
      }

      const encoded = route
        .split("/")
        .map(segment)
        .join("/");

      return send(
        "GET",
        `/api/public/portfolios/${encoded}`,
      );
    },
  });
}