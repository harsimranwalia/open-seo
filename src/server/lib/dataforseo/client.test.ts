import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("cloudflare:workers", () => ({
  waitUntil: vi.fn(),
}));

const fetchRelatedKeywords = vi.fn();

vi.mock("@/server/lib/dataforseo/sections", () => ({
  fetchRelatedKeywords,
  fetchKeywordSuggestions: vi.fn(),
  fetchKeywordIdeas: vi.fn(),
  fetchAdsKeywordIdeas: vi.fn(),
  fetchAdsSearchVolume: vi.fn(),
  fetchDomainRankOverview: vi.fn(),
  fetchRankedKeywords: vi.fn(),
  fetchRelevantPages: vi.fn(),
  fetchKeywordOverview: vi.fn(),
  fetchSerpCompetitors: vi.fn(),
  fetchLiveSerp: vi.fn(),
  fetchRankCheckSerp: vi.fn(),
  postRankCheckTasks: vi.fn(),
  fetchLocalSerp: vi.fn(),
  fetchBusinessListingsSearch: vi.fn(),
  fetchQuestionsAnswers: vi.fn(),
  fetchBacklinksSummary: vi.fn(),
  fetchBacklinksRows: vi.fn(),
  fetchReferringDomains: vi.fn(),
  fetchDomainPagesSummary: vi.fn(),
  fetchBacklinksHistory: vi.fn(),
  fetchLlmMentionsSearch: vi.fn(),
  fetchLlmAggregatedMetrics: vi.fn(),
  fetchLlmTopPages: vi.fn(),
  fetchLlmCrossAggregatedMetrics: vi.fn(),
  fetchLlmResponse: vi.fn(),
  fetchLighthouseResult: vi.fn(),
}));

import { createDataforseoClient } from "@/server/lib/dataforseo/client";

const customer = {
  organizationId: "org_1",
  userEmail: "user@example.com",
  userId: "user_1",
};

describe("createDataforseoClient without billing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns provider data without credit metering", async () => {
    fetchRelatedKeywords.mockResolvedValue({
      data: [{ keyword: "seo" }],
      billing: { costUsd: 0.01, path: ["dataforseo", "labs"] },
    });

    const client = createDataforseoClient(customer);
    const result = await client.keywords.related({
      keyword: "seo",
      locationCode: 2840,
      languageCode: "en",
      limit: 10,
    });

    expect(result).toEqual([{ keyword: "seo" }]);
    expect(fetchRelatedKeywords).toHaveBeenCalledTimes(1);
  });
});
