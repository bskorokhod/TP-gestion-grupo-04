import { useCallback } from "react";
import { useLocation } from "wouter";

import { BrandCreate } from "@/components/BrandCreate/BrandCreate";
import { BrandCreateRequest } from "@/models/Brand";
import { useBrandCreate } from "@/services/BrandServices";

import { CommonLayout } from "../components/CommonLayout/CommonLayout";

export const BrandCreateScreen = () => {
  const { mutate, error } = useBrandCreate();
  const [, navigate] = useLocation();

  const onSubmit = useCallback(
    async (data: BrandCreateRequest) => {
      mutate(data, {
        onSuccess: (response) => navigate(`/brands/${response.id}`),
      });
    },
    [mutate, navigate],
  );

  return (
    <CommonLayout>
      <BrandCreate onSubmit={onSubmit} submitError={error} />
    </CommonLayout>
  );
};
