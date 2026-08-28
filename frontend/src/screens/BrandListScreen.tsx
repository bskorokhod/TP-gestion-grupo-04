import { BrandList } from "@/components/BrandList/BrandList";
import { useBrandList } from "@/services/BrandServices";

import { CommonLayout } from "../components/CommonLayout/CommonLayout";

export const BrandListScreen = () => {
  const brandData = useBrandList();

  return (
    <CommonLayout>
      {brandData.isLoading ? (
        "Loading..."
      ) : !brandData.data ? (
        "Data load failed"
      ) : (
        <BrandList brands={brandData.data} />
      )}
    </CommonLayout>
  );
};
