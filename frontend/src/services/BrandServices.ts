import { useMutation, useQuery } from "@tanstack/react-query";

import { BASE_API_URL } from "@/config/app-query-client";

import { Brand, BrandCreateRequest, BrandSchema } from "../models/Brand";
import { useAccessTokenGetter, useHandleResponse } from "./TokenContext";

export function useBrandList() {
  const getAccessToken = useAccessTokenGetter();
  const handleResponse = useHandleResponse();

  return useQuery({
    queryKey: ["brands"],
    queryFn: async (): Promise<Brand[]> => {
      const response = await fetch(BASE_API_URL + "/brands", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${await getAccessToken()}`,
        },
      });

      return handleResponse(response, (json) => BrandSchema.array().parse(json));
    },
  });
}

export function useBrand(id: string) {
  const getAccessToken = useAccessTokenGetter();
  const handleResponse = useHandleResponse();

  return useQuery({
    queryKey: ["brand", id],
    queryFn: async (): Promise<Brand> => {
      const response = await fetch(`${BASE_API_URL}/brands/${id}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${await getAccessToken()}`,
        },
      });

      return handleResponse(response, (json) => BrandSchema.parse(json));
    },
  });
}

export function useBrandCreate() {
  const getAccessToken = useAccessTokenGetter();
  const handleResponse = useHandleResponse();

  return useMutation({
    mutationFn: async (data: BrandCreateRequest): Promise<Brand> => {
      const response = await fetch(`${BASE_API_URL}/brands`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${await getAccessToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return handleResponse(response, (json) => BrandSchema.parse(json));
    },
  });
}
